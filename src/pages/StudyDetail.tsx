import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
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
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  CardRow,
  CardSortConfig,
  CardSortResponseData,
  CategoryRow,
  FirstClickConfig,
  StudyStatus,
  StudyType,
  SurveyConfig,
  SurveyQuestion,
} from "@/lib/types";
import FirstClickResults from "./results/FirstClickResults";

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
// metrics and per-type result visualizations below.
export default function StudyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [study, setStudy] = useState<StudyData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        navigate("/dashboard");
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

  const share = async () => {
    if (!study?.slug) return;
    const url = `${window.location.origin}/s/${study.slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied");
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
    navigate("/dashboard", { replace: true });
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
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  const canShare = study.status === "live" && !!study.slug;
  const canExport = (study.type === "survey" || study.type === "card_sort") && responses.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-6xl py-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <h1 className="text-5xl font-semibold tracking-tight">
            {study.title || "Untitled"}
          </h1>

          <div className="flex flex-wrap gap-3">
            {canShare && (
              <Button size="lg" className="rounded-full" onClick={share}>
                Share
              </Button>
            )}
            {canExport && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-full"
                onClick={exportCsv}
              >
                <Download className="mr-1.5 h-4 w-4" /> Export CSV
              </Button>
            )}
            <Button asChild size="lg" className="rounded-full">
              <Link to={`/dashboard/studies/${study.id}/edit`}>Edit</Link>
            </Button>
            <Button
              size="lg"
              className="rounded-full"
              onClick={() => setConfirmOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        <section className="mt-12 grid grid-cols-3 gap-4">
          <Stat label="Responses" value={responses.length.toString()} />
          <Stat label="Completion rate" value={`${completionRate}%`} />
          <Stat label="Avg time" value={avgTime !== null ? `${avgTime}s` : "—"} />
        </section>

        <section className="mt-12 space-y-10">
          {responses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              No responses yet. Share your study link to start collecting data.
            </div>
          ) : (
            <>
              {study.type === "survey" && (
                <SurveyResults
                  config={(study.config as SurveyConfig) ?? { questions: [] }}
                  responses={responses}
                />
              )}
              {study.type === "card_sort" && (
                <CardSortResults
                  cards={cards}
                  categories={categories}
                  config={(study.config as CardSortConfig) ?? { sort_type: "open" }}
                  responses={responses}
                />
              )}
              {study.type === "first_click" && (
                <FirstClickResults
                  config={(study.config as FirstClickConfig) ?? { task: "", image_url: "" }}
                  responses={responses}
                />
              )}
              {(study.type === "tree_test" || study.type === "five_second") && (
                <div className="text-sm text-muted-foreground">
                  {responses.length} response{responses.length === 1 ? "" : "s"} recorded.
                  Detailed visualizations for this study type are coming soon.
                </div>
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SurveyResults({
  config,
  responses,
}: {
  config: SurveyConfig;
  responses: ResponseRow[];
}) {
  const questions = config.questions ?? [];
  if (questions.length === 0) {
    return <div className="text-sm text-muted-foreground">No questions in this study.</div>;
  }
  return (
    <>
      {questions.map((q, i) => (
        <QuestionResult key={q.id} q={q} index={i} responses={responses} />
      ))}
    </>
  );
}

function QuestionResult({
  q,
  index,
  responses,
}: {
  q: SurveyQuestion;
  index: number;
  responses: ResponseRow[];
}) {
  const values = responses
    .map((r) => (r.data as { answers?: Record<string, unknown> })?.answers?.[q.id])
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  if (q.type === "open_text") {
    return (
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Question {index + 1} · open text
        </div>
        <h3 className="mt-1 font-medium">{q.label}</h3>
        <ul className="mt-4 space-y-2">
          {values.length === 0 && (
            <li className="text-sm text-muted-foreground">No responses yet.</li>
          )}
          {values.map((v, i) => (
            <li key={i} className="rounded-md border border-border p-3 text-sm whitespace-pre-wrap">
              {v}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const buckets: string[] =
    q.type === "likert" ? ["1", "2", "3", "4", "5"] : (q.options ?? []);
  const counts = buckets.map((b) => values.filter((v) => v === b).length);
  const max = Math.max(1, ...counts);

  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Question {index + 1} · {q.type === "likert" ? "likert" : "multiple choice"}
      </div>
      <h3 className="mt-1 font-medium">{q.label}</h3>
      <ul className="mt-4 space-y-2">
        {buckets.map((b, i) => {
          const count = counts[i];
          const pct = values.length ? Math.round((count / values.length) * 100) : 0;
          return (
            <li key={b} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 truncate">{b}</span>
              <div className="relative h-6 flex-1 rounded bg-secondary">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-foreground"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-muted-foreground">
                {count} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CardSortResults({
  cards,
  categories: _categories,
  config,
  responses,
}: {
  cards: CardRow[];
  categories: CategoryRow[];
  config: CardSortConfig;
  responses: ResponseRow[];
}) {
  const norm = (s: string) => s.trim().toLowerCase();

  const stats = cards.map((card) => {
    const tally = new Map<string, { display: string; count: number }>();
    let placed = 0;
    responses.forEach((r) => {
      const data = r.data as unknown as CardSortResponseData;
      (data.groups ?? []).forEach((g) => {
        if (!g.card_ids.includes(card.id)) return;
        placed += 1;
        const key =
          config.sort_type === "closed" && g.category_id
            ? `id:${g.category_id}`
            : `lbl:${norm(g.category_label)}`;
        const existing = tally.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          tally.set(key, { display: g.category_label || "(unnamed)", count: 1 });
        }
      });
    });
    const sorted = [...tally.values()].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    return {
      card,
      placed,
      top,
      pct: top && placed ? Math.round((top.count / placed) * 100) : 0,
      breakdown: sorted,
    };
  });

  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Card placements
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Top category for each card and how often participants placed it there.
      </p>
      <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
        {stats.map(({ card, top, pct, placed, breakdown }) => (
          <li key={card.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium">{card.label}</div>
                {card.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {card.description}
                  </div>
                )}
              </div>
              <div className="text-right text-sm">
                {top ? (
                  <>
                    <div className="font-medium">{top.display}</div>
                    <div className="text-xs text-muted-foreground">
                      {pct}% ({top.count}/{placed})
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">No placements</div>
                )}
              </div>
            </div>
            {breakdown.length > 1 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Show all categories
                </summary>
                <ul className="mt-2 space-y-1">
                  {breakdown.map((b, i) => (
                    <li
                      key={i}
                      className="flex justify-between text-xs text-muted-foreground"
                    >
                      <span className="truncate">{b.display}</span>
                      <span>{b.count}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function csvEscape(v: string) {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
