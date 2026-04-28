// Card sort results for the "Where does it go in the fridge?" example.
// Three stacked sections: BY CARD (stacked bar), MATRIX (table),
// DISAGREEMENT (entropy bar). Built on shadcn ChartContainer + Recharts.
//
// If `userPlacement` is provided, the visitor's submission is merged in
// (incrementing one cell per card) so displayed numbers tick up by 1.

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SectionHeader, Stat, StatGrid } from "@/components/study/primitives";

const SEED_TOTAL = 20;

const CATEGORIES = [
  "Door",
  "Top shelf",
  "Middle shelf",
  "Bottom shelf",
  "Freezer",
  "Trash",
] as const;
type Category = (typeof CATEGORIES)[number];

type Row = { card: string } & Record<Category, number>;

const SEED: Row[] = [
  { card: "Ketchup",            Door: 9,  "Top shelf": 0,  "Middle shelf": 7,  "Bottom shelf": 0, Freezer: 0, Trash: 4 },
  { card: "Mayo",               Door: 4,  "Top shelf": 8,  "Middle shelf": 5,  "Bottom shelf": 0, Freezer: 0, Trash: 3 },
  { card: "Leftover pizza",     Door: 0,  "Top shelf": 2,  "Middle shelf": 10, "Bottom shelf": 5, Freezer: 3, Trash: 0 },
  { card: "Beer",               Door: 14, "Top shelf": 3,  "Middle shelf": 3,  "Bottom shelf": 0, Freezer: 0, Trash: 0 },
  { card: "Oat milk",           Door: 2,  "Top shelf": 10, "Middle shelf": 8,  "Bottom shelf": 0, Freezer: 0, Trash: 0 },
  { card: "Mystery tupperware", Door: 0,  "Top shelf": 0,  "Middle shelf": 2,  "Bottom shelf": 3, Freezer: 1, Trash: 14 },
  { card: "Wilting spinach",    Door: 0,  "Top shelf": 0,  "Middle shelf": 1,  "Bottom shelf": 2, Freezer: 0, Trash: 17 },
  { card: "Cheese",             Door: 1,  "Top shelf": 6,  "Middle shelf": 11, "Bottom shelf": 2, Freezer: 0, Trash: 0 },
  { card: "Hot sauce",          Door: 12, "Top shelf": 2,  "Middle shelf": 4,  "Bottom shelf": 0, Freezer: 0, Trash: 2 },
  { card: "Birthday cake",      Door: 0,  "Top shelf": 4,  "Middle shelf": 8,  "Bottom shelf": 3, Freezer: 5, Trash: 0 },
  { card: "Baking soda",        Door: 3,  "Top shelf": 1,  "Middle shelf": 5,  "Bottom shelf": 8, Freezer: 0, Trash: 3 },
  { card: "Eggs",               Door: 7,  "Top shelf": 1,  "Middle shelf": 3,  "Bottom shelf": 9, Freezer: 0, Trash: 0 },
];

// Map: card label -> category label.
export type FridgePlacement = Record<string, string>;

// Recharts dataKeys can't include spaces cleanly with the chart config keys —
// use safe slug keys for both data and config.
const SLUG: Record<Category, string> = {
  Door: "door",
  "Top shelf": "top",
  "Middle shelf": "middle",
  "Bottom shelf": "bottom",
  Freezer: "freezer",
  Trash: "trash",
};

// Category palette — references chart tokens so dark mode and theming work.
const COLORS = {
  door:    "hsl(var(--chart-1))",
  top:     "hsl(var(--chart-2))",
  middle:  "hsl(var(--chart-3))",
  bottom:  "hsl(var(--chart-4))",
  freezer: "hsl(var(--chart-5))",
  trash:   "hsl(var(--chart-6))",
} as const;

// Raw HSL triplets for the matrix (we need to inject alpha for cell tinting).
const COLOR_VARS: Record<keyof typeof COLORS, string> = {
  door:    "var(--chart-1)",
  top:     "var(--chart-2)",
  middle:  "var(--chart-3)",
  bottom:  "var(--chart-4)",
  freezer: "var(--chart-5)",
  trash:   "var(--chart-6)",
};

const chartConfig = {
  door:    { label: "Door",         color: COLORS.door },
  top:     { label: "Top shelf",    color: COLORS.top },
  middle:  { label: "Middle shelf", color: COLORS.middle },
  bottom:  { label: "Bottom shelf", color: COLORS.bottom },
  freezer: { label: "Freezer",      color: COLORS.freezer },
  trash:   { label: "Trash",        color: COLORS.trash },
} satisfies ChartConfig;

const chaosConfig = {
  chaos: { label: "Chaos", color: COLORS.door },
} satisfies ChartConfig;

interface Props {
  userPlacement?: FridgePlacement;
}

export default function FridgeCardSortResults({ userPlacement }: Props) {
  const { rows, total } = useMemo(() => {
    if (!userPlacement) return { rows: SEED, total: SEED_TOTAL };
    const next = SEED.map((r) => {
      const cat = userPlacement[r.card];
      if (!cat || !(CATEGORIES as readonly string[]).includes(cat)) return r;
      return { ...r, [cat as Category]: r[cat as Category] + 1 } as Row;
    });
    return { rows: next, total: SEED_TOTAL + 1 };
  }, [userPlacement]);

  const pct = (n: number) => Math.round((n / total) * 100);

  // Per-card percentage data, used by stacked bar chart.
  const byCard = rows.map((r) => {
    const out: Record<string, number | string> = { card: r.card };
    for (const c of CATEGORIES) out[SLUG[c]] = pct(r[c]);
    return out;
  });

  // Entropy normalized to 0..100.
  const chaosOf = (r: Row) => {
    let h = 0;
    for (const c of CATEGORIES) {
      const v = r[c];
      if (v === 0) continue;
      const p = v / total;
      h -= p * Math.log2(p);
    }
    return Math.round((h / Math.log2(CATEGORIES.length)) * 100);
  };

  const disagreement = rows
    .map((r) => ({ card: r.card, chaos: chaosOf(r) }))
    .sort((a, b) => b.chaos - a.chaos);

  return (
    <div className="space-y-8">
      <StatGrid>
        <Stat label="Responses" value={String(total)} />
        <Stat label="Cards" value={String(rows.length)} />
        <Stat label="Categories" value={String(CATEGORIES.length)} />
      </StatGrid>

      <ByCardSection data={byCard} />
      <MatrixSection rows={rows} pct={pct} />
      <DisagreementSection data={disagreement} />
    </div>
  );
}

// (local Stat removed — now imported from @/components/study/primitives)

// (was a local SectionHeader — now using the shared one from primitives)

function ByCardSection({ data }: { data: Record<string, number | string>[] }) {
  return (
    <section className="space-y-3">
      <SectionHeader title="By card" />
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[480px] w-full"
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
          stackOffset="expand"
        >
          <CartesianGrid horizontal={false} stroke="hsl(var(--chart-grid))" />
          <XAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
            stroke="hsl(var(--chart-axis))"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="card"
            width={140}
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const cfg = chartConfig[name as keyof typeof chartConfig];
                  return (
                    <div className="flex w-full justify-between gap-4">
                      <span>{cfg?.label ?? name}</span>
                      <span className="font-mono font-medium">{value}%</span>
                    </div>
                  );
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {CATEGORIES.map((c) => (
            <Bar
              key={c}
              dataKey={SLUG[c]}
              stackId="a"
              fill={`var(--color-${SLUG[c]})`}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </section>
  );
}

function MatrixSection({
  rows,
  pct,
}: {
  rows: Row[];
  pct: (n: number) => number;
}) {
  // Map category → CSS variable name (without the hsl() wrapper) so we can
  // inject alpha for cell tinting.
  const CAT_VAR: Record<Category, string> = {
    Door: COLOR_VARS.door,
    "Top shelf": COLOR_VARS.top,
    "Middle shelf": COLOR_VARS.middle,
    "Bottom shelf": COLOR_VARS.bottom,
    Freezer: COLOR_VARS.freezer,
    Trash: COLOR_VARS.trash,
  };
  return (
    <section className="space-y-3">
      <SectionHeader title="Matrix" />
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium" />
              {CATEGORIES.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.card} className="border-b last:border-b-0">
                <td className="px-3 py-2 font-medium whitespace-nowrap">
                  {r.card}
                </td>
                {CATEGORIES.map((c) => {
                  const p = pct(r[c]);
                  const alpha = p === 0 ? 0 : 0.1 + (p / 100) * 0.6;
                  return (
                    <td
                      key={c}
                      className="px-3 py-2 text-center"
                      style={{
                        backgroundColor:
                          p === 0
                            ? "transparent"
                            : `hsl(${CAT_VAR[c]} / ${alpha.toFixed(3)})`,
                      }}
                    >
                      {p === 0 ? "" : `${p}%`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DisagreementSection({
  data,
}: {
  data: { card: string; chaos: number }[];
}) {
  return (
    <section className="space-y-3">
      <SectionHeader title="Disagreement" />
      <ChartContainer
        config={chaosConfig}
        className="aspect-auto h-[420px] w-full"
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 32, bottom: 8, left: 16 }}
        >
          <CartesianGrid horizontal={false} stroke="hsl(var(--chart-grid))" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="hsl(var(--chart-axis))"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="card"
            width={140}
            stroke="hsl(var(--foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex w-full justify-between gap-4">
                    <span>Chaos</span>
                    <span className="font-mono font-medium">{value}%</span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="chaos"
            fill="var(--color-chaos)"
            isAnimationActive={false}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
