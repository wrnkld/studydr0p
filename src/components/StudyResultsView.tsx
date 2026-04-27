import { useEffect, useMemo, useState } from "react";
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
import { Stat, StatGrid } from "@/components/study/primitives";

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
}

/**
 * Renders results stats + per-type result visualizations for a single study.
 * Used both by the standalone /studies/:id/results page and by the Results
 * tab inside the builder.
 */
export default function StudyResultsView({ studyId, showHeader = true }: Props) {
  const [study, setStudy] = useState<StudyData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studyId) return;
    (async () => {
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
    })();
  }, [studyId]);

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
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const canExport =
    (study.type === "survey" || study.type === "card_sort") && responses.length > 0;

  return (
    <div className="space-y-6 py-6">
      {showHeader && canExport && (
        <div className="flex justify-end">
          <button onClick={exportCsv} className="text-sm underline">
            Export CSV
          </button>
        </div>
      )}

      <StatGrid>
        <Stat label="Responses" value={String(responses.length)} />
        {study.type === "survey" ? (
          <Stat
            label="Questions"
            value={String(((study.config as SurveyConfig)?.questions ?? []).length)}
          />
        ) : study.type === "card_sort" ? (
          <Stat label="Cards" value={String(cards.length)} />
        ) : (
          <Stat label="Completion" value={`${completionRate}%`} />
        )}
        <Stat label="Avg time" value={avgTime !== null ? `${avgTime}s` : "—"} />
      </StatGrid>

      <section>
        {responses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No responses yet. Share your study link to start collecting data.
          </p>
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
