// Card sort results for the "Where does it go in the fridge?" example.
// Three stacked sections: BY CARD (stacked bar), MATRIX (table),
// DISAGREEMENT (entropy bar). Built on shadcn ChartContainer + Recharts.

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

const TOTAL = 20;

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

const RAW: Row[] = [
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

// Local chart palette — overrides the monochrome app theme so categories
// are visually distinguishable. Recharts-style defaults.
const COLORS = {
  door:    "hsl(221 83% 53%)",  // blue
  top:     "hsl(142 71% 45%)",  // green
  middle:  "hsl(38 92% 50%)",   // amber
  bottom:  "hsl(271 76% 53%)",  // purple
  freezer: "hsl(199 89% 48%)",  // cyan
  trash:   "hsl(0 72% 51%)",    // red
} as const;

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

function pct(n: number) {
  return Math.round((n / TOTAL) * 100);
}

// Per-card percentage data, used by stacked bar chart.
const BY_CARD = RAW.map((r) => {
  const out: Record<string, number | string> = { card: r.card };
  for (const c of CATEGORIES) out[SLUG[c]] = pct(r[c]);
  return out;
});

// Entropy normalized to 0..100.
function chaosOf(r: Row) {
  let h = 0;
  for (const c of CATEGORIES) {
    const v = r[c];
    if (v === 0) continue;
    const p = v / TOTAL;
    h -= p * Math.log2(p);
  }
  return Math.round((h / Math.log2(CATEGORIES.length)) * 100);
}

const DISAGREEMENT = RAW.map((r) => ({ card: r.card, chaos: chaosOf(r) }))
  .sort((a, b) => b.chaos - a.chaos);

export default function FridgeCardSortResults() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-4">
        <Stat label="Responses" value={String(TOTAL)} />
        <Stat label="Cards" value={String(RAW.length)} />
        <Stat label="Categories" value={String(CATEGORIES.length)} />
      </section>

      <ByCardSection />
      <MatrixSection />
      <DisagreementSection />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-medium">{value}</div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-medium border-b pb-2">{children}</h3>
  );
}

function ByCardSection() {
  return (
    <section className="space-y-3">
      <SectionHeader>By card</SectionHeader>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[480px] w-full"
      >
        <BarChart
          data={BY_CARD}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
          stackOffset="expand"
        >
          <CartesianGrid horizontal={false} stroke="hsl(0 0% 90%)" />
          <XAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
            stroke="hsl(0 0% 40%)"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="card"
            width={140}
            stroke="hsl(0 0% 10%)"
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

function MatrixSection() {
  const CAT_COLOR: Record<Category, string> = {
    Door: COLORS.door,
    "Top shelf": COLORS.top,
    "Middle shelf": COLORS.middle,
    "Bottom shelf": COLORS.bottom,
    Freezer: COLORS.freezer,
    Trash: COLORS.trash,
  };
  return (
    <section className="space-y-3">
      <SectionHeader>Matrix</SectionHeader>
      <div className="overflow-x-auto rounded-md border">
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
            {RAW.map((r) => (
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
                            : CAT_COLOR[c].replace(
                                /hsl\(([^)]+)\)/,
                                `hsl($1 / ${alpha.toFixed(3)})`,
                              ),
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

function DisagreementSection() {
  return (
    <section className="space-y-3">
      <SectionHeader>Disagreement</SectionHeader>
      <ChartContainer
        config={chaosConfig}
        className="aspect-auto h-[420px] w-full"
      >
        <BarChart
          data={DISAGREEMENT}
          layout="vertical"
          margin={{ top: 8, right: 32, bottom: 8, left: 16 }}
        >
          <CartesianGrid horizontal={false} stroke="hsl(0 0% 90%)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="hsl(0 0% 40%)"
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="card"
            width={140}
            stroke="hsl(0 0% 10%)"
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
