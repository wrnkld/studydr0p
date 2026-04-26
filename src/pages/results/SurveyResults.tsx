import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SurveyConfig, SurveyQuestion } from "@/lib/types";

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

const barConfig = {
  value: { label: "Responses", color: "hsl(221 83% 53%)" },
} satisfies ChartConfig;

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
      const counts: Record<string, number> = {};
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

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }

  return (
    <div className="space-y-12">
      {summaries.map(({ q, counts, texts }, i) => (
        <section key={q.id} className="space-y-4">
          <div className="border-b pb-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Question {i + 1}
            </div>
            <h3 className="mt-1 text-base font-medium">{q.label || q.id}</h3>
          </div>

          {q.type === "open_text" ? (
            texts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No answers.</p>
            ) : (
              <ul className="space-y-3">
                {texts.map((t, idx) => (
                  <li
                    key={idx}
                    className="border-l-2 pl-4 text-sm leading-relaxed"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )
          ) : (
            <AnswerChart counts={counts} q={q} total={total} />
          )}
        </section>
      ))}
    </div>
  );
}

function AnswerChart({
  counts,
  q,
  total,
}: {
  counts: Record<string, number>;
  q: SurveyQuestion;
  total: number;
}) {
  // Always show all configured options (even with zero votes); keep researcher order.
  const options =
    q.options && q.options.length > 0
      ? q.options
      : Object.keys(counts);

  const data = options.map((label) => ({ label, value: counts[label] ?? 0 }));
  const extras = Object.keys(counts).filter((k) => !options.includes(k));
  extras.forEach((k) => data.push({ label: k, value: counts[k] }));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers.</p>;
  }

  const h = Math.max(160, data.length * 40);
  const longest = data.reduce(
    (m, d) => Math.max(m, d.label.length),
    0,
  );
  const yWidth = Math.min(220, Math.max(80, longest * 7));

  return (
    <div className="space-y-3">
      <ChartContainer
        config={barConfig}
        className="aspect-auto w-full"
        style={{ height: h }}
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
        >
          <CartesianGrid horizontal={false} stroke="hsl(0 0% 90%)" />
          <XAxis
            type="number"
            domain={[0, Math.max(total, 1)]}
            allowDecimals={false}
            stroke="hsl(0 0% 40%)"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={yWidth}
            stroke="hsl(0 0% 10%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => {
                  const n = Number(value);
                  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                  return (
                    <div className="flex w-full justify-between gap-4">
                      <span>Responses</span>
                      <span className="font-mono font-medium">
                        {n} · {pct}%
                      </span>
                    </div>
                  );
                }}
              />
            }
          />
          <Bar
            dataKey="value"
            fill="var(--color-value)"
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
