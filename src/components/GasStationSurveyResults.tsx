// Survey results for the "Gas station food. No judgment." example.
// Sections: metadata stats, then per-question visualizations.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const TOTAL = 20;

// Local palette — overrides the monochrome app theme.
const COLORS = {
  primary: "hsl(221 83% 53%)",
  green:   "hsl(142 71% 45%)",
  amber:   "hsl(38 92% 50%)",
  purple:  "hsl(271 76% 53%)",
  cyan:    "hsl(199 89% 48%)",
  red:     "hsl(0 72% 51%)",
} as const;

// Map a value to a blue shade — higher value = darker.
function shadeFor(value: number, max: number) {
  const t = max > 0 ? value / max : 0;
  // Lightness from 80% (lightest) down to 35% (darkest).
  const lightness = 80 - t * 45;
  return `hsl(221 83% ${lightness}%)`;
}

// Shared chart constants — applied to every chart on this page.
const CHART_MARGIN = { top: 8, right: 16, bottom: 8, left: 8 };
const CHART_HEIGHT = 240;
const AXIS_COLOR = "hsl(0 0% 40%)";
const GRID_COLOR = "hsl(0 0% 92%)";

const barConfig = {
  value: { label: "Responses", color: COLORS.primary },
} satisfies ChartConfig;

// ---------- Q1: Hot dog ----------
const Q1_DATA = [
  { label: "Yes", value: 13 },
  { label: "No", value: 7 },
];

// ---------- Q2: Rating 1-10 ----------
// Distribution that averages ~5.8
const Q2_DIST = [
  { score: "1", value: 1 },
  { score: "2", value: 1 },
  { score: "3", value: 2 },
  { score: "4", value: 2 },
  { score: "5", value: 3 },
  { score: "6", value: 3 },
  { score: "7", value: 3 },
  { score: "8", value: 3 },
  { score: "9", value: 1 },
  { score: "10", value: 1 },
];
const Q2_AVG =
  Q2_DIST.reduce((s, d) => s + Number(d.score) * d.value, 0) /
  Q2_DIST.reduce((s, d) => s + d.value, 0);

// ---------- Q3: Multi-select ----------
// Counts can sum >20 (multi-select). Percentages can exceed nothing here
// but bars represent share of participants.
const Q3_DATA = [
  { label: "Beef jerky", value: 17 },
  { label: "Taquito", value: 16 },
  { label: "Donut", value: 13 },
  { label: "Hot dog", value: 10 },
  { label: "Just snacks", value: 8 },
  { label: "Pizza slice", value: 7 },
];

// ---------- Q4: Best chain ----------
const Q4_DATA = [
  { label: "Wawa", value: 7 },
  { label: "Buc-ee's", value: 5 },
  { label: "Sheetz", value: 3 },
  { label: "Casey's", value: 2 },
  { label: "7-Eleven", value: 2 },
  { label: "They're all the same", value: 1 },
];

// ---------- Q5: Open text ----------
const Q5_RESPONSES = [
  "A Slim Jim and a large coffee, that's it.",
  "Hot chips and a Gatorade, every time.",
  "I only buy water",
  "Water and some sorta granola bar",
  "Sheetz or Wawa sandwich",
];

export default function GasStationSurveyResults() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-3 gap-4">
        <Stat label="Responses" value={String(TOTAL)} />
        <Stat label="Questions" value="5" />
        <Stat label="Avg score" value={`${Q2_AVG.toFixed(1)} / 10`} />
      </section>

      <QuestionSection
        number={1}
        title="Have you ever eaten a gas station hot dog?"
      >
        <HBar data={Q1_DATA} />
      </QuestionSection>

      <QuestionSection
        number={2}
        title="Rate your go-to gas station on food quality."
      >
        <ChartContainer
          config={barConfig}
          className="aspect-auto w-full"
          style={{ height: CHART_HEIGHT }}
        >
          <BarChart data={Q2_DIST} margin={CHART_MARGIN}>
            <CartesianGrid vertical={false} stroke={GRID_COLOR} />
            <XAxis
              dataKey="score"
              stroke={AXIS_COLOR}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={AXIS_COLOR}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={32}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <div className="flex w-full justify-between gap-4">
                      <span>Responses</span>
                      <span className="font-mono font-medium">{value}</span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              isAnimationActive={false}
            >
              {Q2_DIST.map((d, i) => {
                const max = Math.max(...Q2_DIST.map((x) => x.value));
                return <Cell key={i} fill={shadeFor(d.value, max)} />;
              })}
            </Bar>
          </BarChart>
        </ChartContainer>
      </QuestionSection>

      <QuestionSection
        number={3}
        title="Which of these have you eaten at a gas station?"
      >
        <HBar data={Q3_DATA} />
      </QuestionSection>

      <QuestionSection
        number={4}
        title="What's the best gas station chain for food?"
      >
        <HBar data={Q4_DATA} />
      </QuestionSection>

      <QuestionSection
        number={5}
        title="Describe your ideal gas station snack in one sentence."
      >
        <ul className="space-y-3">
          {Q5_RESPONSES.map((r, i) => (
            <li
              key={i}
              className="border-l-2 pl-4 text-sm leading-relaxed"
            >
              {r}
            </li>
          ))}
        </ul>
      </QuestionSection>
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

function QuestionSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b pb-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Question {number}
        </div>
        <h3 className="mt-1 text-base font-medium">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function HBar({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <ChartContainer
      config={barConfig}
      className="aspect-auto w-full"
      style={{ height: CHART_HEIGHT }}
    >
      <BarChart data={data} layout="vertical" margin={CHART_MARGIN}>
        <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
        <XAxis
          type="number"
          domain={[0, TOTAL]}
          stroke={AXIS_COLOR}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          stroke={AXIS_COLOR}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval={0}
          width={"auto" as unknown as number}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => {
                const n = Number(value);
                const pct = Math.round((n / TOTAL) * 100);
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
        >
          {data.map((d, i) => {
            const max = Math.max(...data.map((x) => x.value));
            return <Cell key={i} fill={shadeFor(d.value, max)} />;
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
