import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import {
  CardRow,
  CardSortConfig,
  CardSortResponseData,
  CategoryRow,
  FirstClickConfig,
  StudyType,
  SurveyConfig,
  SurveyQuestion,
} from "@/lib/types";
import { toast } from "sonner";
import FirstClickResults from "./results/FirstClickResults";

interface StudyData {
  id: string;
  title: string;
  type: StudyType;
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

export default function StudyResults() {
  const { id } = useParams();
  const [study, setStudy] = useState<StudyData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [studyRes, sessRes, respRes, cardsRes, catsRes] = await Promise.all([
        supabase.from("studies").select("id, title, type, config").eq("id", id).single(),
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
        return;
      }
      setStudy(studyRes.data as StudyData);
      setSessions((sessRes.data ?? []) as SessionRow[]);
      setResponses((respRes.data ?? []) as ResponseRow[]);
      setCards((cardsRes.data ?? []) as CardRow[]);
      setCategories((catsRes.data ?? []) as CategoryRow[]);
      setLoading(false);
    })();
  }, [id]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!study) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-4xl py-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{study.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Results</p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={responses.length === 0}>
            <Download className="mr-1.5 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <section className="mt-8 grid grid-cols-3 gap-4">
          <Stat label="Responses" value={responses.length.toString()} />
          <Stat label="Completion rate" value={`${completionRate}%`} />
          <Stat label="Avg time" value={avgTime !== null ? `${avgTime}s` : "—"} />
        </section>

        <section className="mt-12 space-y-10">
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
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-5">
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
  categories,
  config,
  responses,
}: {
  cards: CardRow[];
  categories: CategoryRow[];
  config: CardSortConfig;
  responses: ResponseRow[];
}) {
  // For each card, count how often it ended up in each category label.
  // For closed sort use category_id; for open sort group by normalized label.
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

  if (responses.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }

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
