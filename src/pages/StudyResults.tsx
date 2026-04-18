import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { SurveyConfig, SurveyQuestion } from "@/lib/types";
import { toast } from "sonner";

interface StudyData {
  id: string;
  title: string;
  type: string;
  config: SurveyConfig;
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
  data: { answers: Record<string, string | string[]> };
  created_at: string;
}

export default function StudyResults() {
  const { id } = useParams();
  const [study, setStudy] = useState<StudyData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [studyRes, sessRes, respRes] = await Promise.all([
        supabase.from("studies").select("id, title, type, config").eq("id", id).single(),
        supabase.from("sessions").select("id, started_at, completed_at, metadata").eq("study_id", id),
        supabase.from("responses").select("id, session_id, data, created_at").eq("study_id", id),
      ]);
      if (studyRes.error || !studyRes.data) {
        toast.error("Study not found");
        return;
      }
      setStudy({
        ...studyRes.data,
        config: (studyRes.data.config as unknown as SurveyConfig) ?? { questions: [] },
      });
      setSessions((sessRes.data ?? []) as SessionRow[]);
      setResponses((respRes.data ?? []) as ResponseRow[]);
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
    const questions = study.config.questions;
    const headers = ["session_id", "submitted_at", ...questions.map((q) => q.label || q.id)];
    const rows = responses.map((r) => {
      const cells = [r.session_id, r.created_at];
      questions.forEach((q) => {
        const v = r.data?.answers?.[q.id];
        cells.push(Array.isArray(v) ? v.join("; ") : (v ?? "").toString());
      });
      return cells.map(csvEscape).join(",");
    });
    const csv = [headers.map(csvEscape).join(","), ...rows].join("\n");
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
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
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
          {study.config.questions.length === 0 && (
            <div className="text-sm text-muted-foreground">No questions in this study.</div>
          )}
          {study.config.questions.map((q, i) => (
            <QuestionResult key={q.id} q={q} index={i} responses={responses} />
          ))}
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
    .map((r) => r.data?.answers?.[q.id])
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  if (q.type === "open_text") {
    return (
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Question {index + 1} · open text
        </div>
        <h3 className="mt-1 font-medium">{q.label}</h3>
        <ul className="mt-4 space-y-2">
          {values.length === 0 && <li className="text-sm text-muted-foreground">No responses yet.</li>}
          {values.map((v, i) => (
            <li key={i} className="rounded-md border border-border p-3 text-sm whitespace-pre-wrap">{v}</li>
          ))}
        </ul>
      </div>
    );
  }

  // bar chart for choice & likert
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

function csvEscape(v: string) {
  if (v == null) return "";
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
