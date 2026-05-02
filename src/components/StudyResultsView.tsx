import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import FirstClickResults from "@/pages/results/FirstClickResults";
import SurveyResults from "@/pages/results/SurveyResults";
import CardSortResults from "@/pages/results/CardSortResults";
import TreeTestResults from "@/pages/results/TreeTestResults";
import FiveSecondResults from "@/pages/results/FiveSecondResults";
import { useStudyToolbar } from "@/components/StudyToolbarContext";
import { BarChart3, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface Props {
  studyId: string;
  /** When true, show the export button + stats header. Defaults to true. */
  showHeader?: boolean;
  /** Hint that a response was just submitted — suppress empty state briefly. */
  pendingResponse?: boolean;
  /** Called once responses have loaded after a pending submission. */
  onResponsesLoaded?: () => void;
}

/**
 * Renders results stats + per-type result visualizations for a single study.
 * Used both by the standalone /studies/:id/results page and by the Results
 * tab inside the builder.
 */
export default function StudyResultsView({ studyId, showHeader = true, pendingResponse, onResponsesLoaded }: Props) {
  const [study, setStudy] = useState<StudyData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studyId) return;
    let cancelled = false;
    const load = async () => {
      const [studyRes, sessRes, respRes, cardsRes, catsRes] = await Promise.all([
        supabase
          .from("studies")
          .select("id, title, type, status, slug, config")
          .eq("id", studyId)
          .single(),
        supabase
          .from("sessions")
          .select("id, started_at, completed_at, metadata")
          .eq("study_id", studyId),
        supabase
          .from("responses")
          .select("id, session_id, data, created_at")
          .eq("study_id", studyId),
        supabase
          .from("cards")
          .select("id, label, description, position")
          .eq("study_id", studyId)
          .order("position"),
        supabase
          .from("categories")
          .select("id, label, position")
          .eq("study_id", studyId)
          .order("position"),
      ]);
      if (cancelled) return;
      if (studyRes.error || !studyRes.data) {
        toast.error("Study not found");
        return;
      }
      setStudy(studyRes.data as StudyData);
      setSessions((sessRes.data ?? []) as SessionRow[]);
      setResponses((respRes.data ?? []) as ResponseRow[]);
      setCards((cardsRes.data ?? []) as CardRow[]);
      setCategories((catsRes.data ?? []) as CategoryRow[]);
      setLoading(false);
    };

    load();

    // Realtime: refetch when new responses or sessions land for this study.
    const channel = supabase
      .channel(`results-${studyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "responses", filter: `study_id=eq.${studyId}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `study_id=eq.${studyId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [studyId]);

  // Clear pendingResponse flag once responses actually arrive
  useEffect(() => {
    if (pendingResponse && responses.length > 0) {
      onResponsesLoaded?.();
    }
  }, [pendingResponse, responses.length, onResponsesLoaded]);

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

  const canExport =
    !!study &&
    (study.type === "survey" || study.type === "card_sort") &&
    responses.length > 0;

  const { setExportCsv } = useStudyToolbar();
  useEffect(() => {
    if (!canExport) {
      setExportCsv(null);
      return;
    }
    setExportCsv(() => exportCsv);
    return () => setExportCsv(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canExport, study?.id, responses.length, cards.length]);

  if (loading || !study) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 py-6">
      <section>
        {responses.length === 0 && !pendingResponse ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-foreground">No responses yet</p>
            <p className="mt-1 text-sm text-muted-foreground whitespace-nowrap">
              Share your study link with participants to start collecting data.
            </p>
            {study.slug && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  const url = `${window.location.origin}/s/${study.slug}`;
                  navigator.clipboard.writeText(url);
                  toast.success("Link copied");
                }}
              >
                <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                Copy share link
              </Button>
            )}
          </div>
        ) : responses.length === 0 && pendingResponse ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">Loading responses…</p>
          </div>
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
    </div>
  );
}

// (local Stat removed — now imported from @/components/study/primitives)

function csvEscape(v: string) {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
