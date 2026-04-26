import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import {
  CardRow,
  CardSortConfig,
  CardSortResponseData,
  CategoryRow,
  FirstClickConfig,
  FiveSecondConfig,
  StudyStatus,
  StudyType,
  SurveyConfig,
  SurveyQuestion,
  TreeTestConfig,
} from "@/lib/types";
import FirstClickResults from "./results/FirstClickResults";
import SurveyResults from "./results/SurveyResults";
import CardSortResults from "./results/CardSortResults";
import TreeTestResults from "./results/TreeTestResults";
import FiveSecondResults from "./results/FiveSecondResults";

interface StudyData {
  id: string;
  title: string;
  type: StudyType;
  status: StudyStatus;
  slug: string | null;
  config: unknown;
}

interface SessionRow {
  id: string;
  started_at: string;
  completed_at: string | null;
  metadata: { duration_ms?: number } | null;
}

interface ResponseRow {
  id: string;
  session_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

// Single study detail / results page. Title + Share/Edit/Delete on top,
// share link, metrics, and per-type result visualizations below.
export default function StudyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState<StudyData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [studyRes, sessRes, respRes, cardsRes, catsRes] = await Promise.all([
        supabase
          .from("studies")
          .select("id, title, type, status, slug, config")
          .eq("id", id)
          .single(),
        supabase
          .from("sessions")
          .select("id, started_at, completed_at, metadata")
          .eq("study_id", id),
        supabase
          .from("responses")
          .select("id, session_id, data, created_at")
          .eq("study_id", id),
        supabase
          .from("cards")
          .select("id, label, description, position")
          .eq("study_id", id)
          .order("position"),
        supabase
          .from("categories")
          .select("id, label, position")
          .eq("study_id", id)
          .order("position"),
      ]);
      if (studyRes.error || !studyRes.data) {
        toast.error("Study not found");
        navigate("/");
        return;
      }
      setStudy(studyRes.data as StudyData);
      setSessions((sessRes.data ?? []) as SessionRow[]);
      setResponses((respRes.data ?? []) as ResponseRow[]);
      setCards((cardsRes.data ?? []) as CardRow[]);
      setCategories((catsRes.data ?? []) as CategoryRow[]);
      setLoading(false);
    })();
  }, [id, navigate]);

  const completionRate = useMemo(() => {
    if (sessions.length === 0) return 0;
    const completed = sessions.filter((s) => s.completed_at).length;
    return Math.round((completed / sessions.length) * 100);
  }, [sessions]);

  const avgTime = useMemo(() => {
    const durations = sessions
      .map((s) => s.metadata?.duration_ms)
      .filter((d): d is number => typeof d === "number");
    if (!durations.length) return null;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return Math.round(avg / 1000);
  }, [sessions]);

  const shareUrl = study?.slug ? `https://studydrop.app/s/${study.slug}` : null;

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const remove = async () => {
    if (!study) return;
    setDeleting(true);
    const { error } = await supabase.from("studies").delete().eq("id", study.id);
    setDeleting(false);
    setConfirmOpen(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Study deleted");
    navigate("/", { replace: true });
  };

  const exportCsv = () => {
    if (!study) return;
    let csv = "";
    if (study.type === "survey") {
      const questions = ((study.config as SurveyConfig)?.questions ?? []) as SurveyQuestion[];
      const headers = ["session_id", "submitted_at", ...questions.map((q) => q.label || q.id)];
      const rows = responses.map((r) => {
        const cells: string[] = [r.session_id, r.created_at];
        const answers = (r.data as { answers?: Record<string, string | string[]> })?.answers ?? {};
        questions.forEach((q) => {
          const v = answers[q.id];
          cells.push(Array.isArray(v) ? v.join("; ") : (v ?? "").toString());
        });
        return cells.map(csvEscape).join(",");
      });
      csv = [headers.map(csvEscape).join(","), ...rows].join("\n");
    } else if (study.type === "card_sort") {
      const headers = ["session_id", "submitted_at", "card_label", "category_label"];
      const rows: string[] = [];
      responses.forEach((r) => {
        const data = r.data as unknown as CardSortResponseData;
        (data.groups ?? []).forEach((g) => {
          g.card_ids.forEach((cid) => {
            const card = cards.find((c) => c.id === cid);
            rows.push(
              [r.session_id, r.created_at, card?.label ?? cid, g.category_label]
                .map(csvEscape)
                .join(","),
            );
          });
        });
      });
      csv = [headers.map(csvEscape).join(","), ...rows].join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${study.title.replace(/\W+/g, "-").toLowerCase()}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !study) {
    return (
      <>

        <div className="p-6">Loading…</div>
      </>
    );
  }

  const canExport = (study.type === "survey" || study.type === "card_sort") && responses.length > 0;

  return (
    <>

      <main className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1>{study.title || "Untitled"}</h1>
          <div className="space-x-3">
            {canExport && (
              <button onClick={exportCsv} className="underline">
                Export CSV
              </button>
            )}
            <Link to={`/studies/${study.id}/edit`} className="underline">
              Edit
            </Link>
            <button onClick={() => setConfirmOpen(true)} className="underline">
              Delete
            </button>
          </div>
        </div>

        {shareUrl && (
          <section className="space-y-1">
            <div>Participant link</div>
            <div className="space-x-2">
              <input
                id="participant-link"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="border px-2 py-1 font-mono text-sm w-full max-w-md"
              />
              <button onClick={copyShareLink} className="underline">
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
            {study.status !== "live" && (
              <p>
                Study is currently <strong>{study.status}</strong> — participants
                can't submit until you publish it.
              </p>
            )}
          </section>
        )}

        <section className="space-y-1">
          <div>Responses: {responses.length}</div>
          <div>Completion rate: {completionRate}%</div>
          <div>Avg time: {avgTime !== null ? `${avgTime}s` : "—"}</div>
        </section>

        <section className="space-y-6">
          {responses.length === 0 ? (
            <p>No responses yet. Share your study link to start collecting data.</p>
          ) : (
            <>
              {study.type === "survey" && (
                <SurveyResults
                  studyId={study.id}
                  config={(study.config as SurveyConfig) ?? { questions: [] }}
                  responses={responses}
                />
              )}
              {study.type === "card_sort" && (
                <CardSortResults
                  studyId={study.id}
                  cards={cards}
                  responses={responses}
                />
              )}
              {study.type === "first_click" && (
                <FirstClickResults
                  config={(study.config as FirstClickConfig) ?? { task: "", image_url: "" }}
                  responses={responses}
                />
              )}
              {study.type === "tree_test" && (
                <TreeTestResults
                  studyId={study.id}
                  config={
                    (study.config as TreeTestConfig) ?? { task: "", correct_node_id: "" }
                  }
                  responses={responses}
                />
              )}
              {study.type === "five_second" && (
                <FiveSecondResults
                  studyId={study.id}
                  config={
                    (study.config as FiveSecondConfig) ?? {
                      image_url: "",
                      duration_ms: 5000,
                      follow_up: [],
                    }
                  }
                  responses={responses}
                />
              )}
            </>
          )}
        </section>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the study and all of its responses. This
              action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function csvEscape(v: string) {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
