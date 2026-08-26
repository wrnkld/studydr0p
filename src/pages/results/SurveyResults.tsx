import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SurveyConfig, SurveyQuestion } from "@/lib/types";
import {
  ChoiceChart,
  ScaleChart,
  TextResponses,
  BinaryDonut,
  type CountMap,
} from "@/components/survey/SurveyChart";
import { SectionHeader } from "@/components/study/primitives";

interface ResponseRow {
  id: string;
  session_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface Props {
  studyId: string;
  config: SurveyConfig;
  responses?: ResponseRow[];
}

export default function SurveyResults({ studyId, config, responses }: Props) {
  const [rows, setRows] = useState<ResponseRow[] | null>(responses ?? null);
  const [loading, setLoading] = useState(!responses);

  useEffect(() => {
    if (responses) {
      setRows(responses);
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("responses")
        .select("id, session_id, data, created_at")
        .eq("study_id", studyId)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as ResponseRow[]);
      setLoading(false);
    })();
  }, [studyId, responses]);

  const total = rows?.length ?? 0;

  const summaries = useMemo(() => {
    const questions: SurveyQuestion[] = config.questions ?? [];
    return questions.map((q) => {
      const counts: CountMap = {};
      const texts: string[] = [];
      (rows ?? []).forEach((r) => {
        const answers =
          (r.data as { answers?: Record<string, string | string[]> })?.answers ?? {};
        const v = answers[q.id];
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))
          return;
        if (Array.isArray(v)) {
          v.forEach((vv) => (counts[vv] = (counts[vv] ?? 0) + 1));
        } else if (q.type === "open_text") {
          texts.push(String(v));
        } else {
          counts[String(v)] = (counts[String(v)] ?? 0) + 1;
        }
      });
      return { q, counts, texts };
    });
  }, [config, rows]);

  if (loading) return <div className="text-base text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-base text-muted-foreground">No responses yet.</div>;
  }

  return (
    <div className="space-y-8">

      {summaries.map(({ q, counts, texts }, i) => (
        <section key={q.id} className="space-y-4">
          <SectionHeader
            kicker={`Question ${i + 1}`}
            title={q.label || q.id}
          />
          <QuestionViz q={q} counts={counts} texts={texts} total={total} />
        </section>
      ))}
    </div>
  );
}

// Picks the chart type based on question type and option count.
//  - open_text         → list
//  - likert (1..5)     → scale chart with average
//  - single_choice / multiple_choice
//      exactly 2 opts  → donut
//      otherwise       → horizontal bar
function QuestionViz({
  q,
  counts,
  texts,
  total,
}: {
  q: SurveyQuestion;
  counts: CountMap;
  texts: string[];
  total: number;
}) {
  if (q.type === "open_text") {
    return <TextResponses responses={texts} />;
  }
  if (q.type === "likert") {
    return <ScaleChart min={1} max={5} counts={counts} />;
  }
  // single_choice / multiple_choice
  const options = q.options && q.options.length > 0 ? q.options : Object.keys(counts);
  if (options.length === 2) {
    return <BinaryDonut options={options} counts={counts} total={total} />;
  }
  return <ChoiceChart options={options} counts={counts} total={total} />;
}
