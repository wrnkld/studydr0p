import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardRow, CardSortResponseData } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ResponseRow {
  id: string;
  session_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface Props {
  studyId: string;
  cards: CardRow[];
  responses?: ResponseRow[];
}

export default function CardSortResults({ studyId, cards, responses }: Props) {
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

  const { categories, chartData } = useMemo(() => {
    const list = rows ?? [];
    const catSet = new Set<string>();
    const byCard: Record<string, Record<string, number>> = {};

    list.forEach((r) => {
      const data = r.data as unknown as CardSortResponseData;
      (data.groups ?? []).forEach((g) => {
        const cat = g.category_label || "(unnamed)";
        catSet.add(cat);
        g.card_ids.forEach((cid) => {
          if (!byCard[cid]) byCard[cid] = {};
          byCard[cid][cat] = (byCard[cid][cat] ?? 0) + 1;
        });
      });
    });

    const categories = Array.from(catSet);

    const chartData = cards.map((card) => {
      const counts = byCard[card.id] ?? {};
      const entry: Record<string, string | number> = { name: card.label };
      categories.forEach((c) => {
        entry[c] = counts[c] ?? 0;
      });
      return entry;
    });

    return { categories, chartData };
  }, [rows, cards]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }
  if (categories.length === 0) {
    return <div className="text-sm text-muted-foreground">No sorted cards yet.</div>;
  }

  const palette = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--chart-6, var(--chart-1)))",
  ];

  const barHeight = 40;
  const chartHeight = Math.max(300, chartData.length * barHeight + 80);

  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Category distribution</h3>
      <div className="rounded-lg border bg-card p-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="hsl(var(--chart-grid))"
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "hsl(var(--chart-axis))" }}
              axisLine={{ stroke: "hsl(var(--chart-grid))" }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 12, fill: "hsl(var(--chart-axis))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
            />
            {categories.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="stack"
                fill={palette[i % palette.length]}
                radius={
                  i === categories.length - 1
                    ? [0, 4, 4, 0]
                    : i === 0
                      ? [4, 0, 0, 4]
                      : undefined
                }
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
