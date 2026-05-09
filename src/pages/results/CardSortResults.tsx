import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardRow, CardSortResponseData } from "@/lib/types";
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
import { CHART_PALETTE } from "@/components/survey/SurveyChart";
import { SectionHeader, Kicker } from "@/components/study/primitives";
import { useIsMobile } from "@/hooks/use-mobile";

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

const PALETTE = CHART_PALETTE;

const AXIS_COLOR = "hsl(var(--chart-axis))";
const GRID_COLOR = "hsl(var(--chart-grid))";
const AXIS_FONT = "'Calibre', ui-sans-serif, system-ui, sans-serif";

export default function CardSortResults({ studyId, cards, responses }: Props) {
  const [rows, setRows] = useState<ResponseRow[] | null>(responses ?? null);
  const [loading, setLoading] = useState(!responses);
  const isMobile = useIsMobile();

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

  const { categories, chartData, byCard } = useMemo(() => {
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

    return { categories, chartData, byCard };
  }, [rows, cards]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }
  if (categories.length === 0) {
    return <div className="text-sm text-muted-foreground">No sorted cards yet.</div>;
  }

  const colorFor = (cat: string) => PALETTE[categories.indexOf(cat) % PALETTE.length];

  // Build ChartConfig for ChartContainer
  const chartConfig: ChartConfig = {};
  categories.forEach((cat) => {
    chartConfig[cat] = { label: cat, color: colorFor(cat) };
  });

  const yAxisWidth = isMobile ? 72 : 120;
  const rowHeight = 28;
  const chartHeight = Math.max(180, chartData.length * rowHeight + 48);

  return (
    <div className="space-y-8">
      {/* ---------- Stacked bar chart ---------- */}
      <section className="space-y-3">
        <h3 className="text-base font-medium">Category distribution</h3>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {categories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: colorFor(c) }}
              />
              {c}
            </span>
          ))}
        </div>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full"
          style={{ height: chartHeight }}
        >
          <BarChart
            data={chartData}
            layout="vertical"
            barSize={14}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
            <XAxis
              type="number"
              stroke={AXIS_COLOR}
              fontSize={12}
              fontFamily={AXIS_FONT}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              stroke={AXIS_COLOR}
              fontSize={12}
              fontFamily={AXIS_FONT}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (value === 0) return null;
                    return (
                      <div className="flex w-full justify-between gap-4">
                        <span>{String(name)}</span>
                        <span className="font-medium tabular-nums">{value}</span>
                      </div>
                    );
                  }}
                />
              }
            />
            {categories.map((cat) => (
              <Bar
                key={cat}
                dataKey={cat}
                stackId="stack"
                fill={`var(--color-${CSS.escape(cat)})`}
                style={{ fill: colorFor(cat) }}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </section>

      {/* ---------- Matrix table ---------- */}
      <section className="space-y-3">
        <h3 className="text-base font-medium">Matrix</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium" />
                {categories.map((c) => (
                  <th
                    key={c}
                    className="px-3 py-2 text-center font-medium whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const counts = byCard[card.id] ?? {};
                const placedTotal = Object.values(counts).reduce((a, b) => a + b, 0);
                return (
                  <tr key={card.id} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {card.label}
                    </td>
                    {categories.map((c) => {
                      const n = counts[c] ?? 0;
                      const pct = placedTotal > 0 ? Math.round((n / placedTotal) * 100) : 0;
                      const alpha = pct === 0 ? 0 : 0.08 + (pct / 100) * 0.6;
                      return (
                        <td
                          key={c}
                          className="px-3 py-2 text-center"
                          style={{
                            backgroundColor:
                              pct === 0
                                ? "transparent"
                                : `hsl(var(--chart-1) / ${alpha.toFixed(3)})`,
                          }}
                        >
                          {n === 0 ? "" : `${pct}%`}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
