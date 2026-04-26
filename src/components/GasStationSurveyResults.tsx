// Survey results for the "Gas station food. No judgment." example.
// Sections: metadata stats, then per-question visualizations.

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

const barConfig = {
  value: { label: "Responses", color: COLORS.primary },
} satisfies ChartConfig;

// ---------- Q1: Hot dog ----------
const Q1_DATA = [
  { label: "Yes", value: 10 },
  { label: "No", value: 6 },
  { label: "I don't want to talk about it", value: 4 },
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
  { label: "Roller grill mystery item", value: 11 },
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
    <div className="bg-white text-black space-y-12">
      {/* Top metadata row */}
      <section className="flex flex-wrap gap-x-24 gap-y-8 pt-4">
        {[
          { n: TOTAL, label: "participants" },
          { n: 5, label: "questions" },
        ].map((m) => (
          <div key={m.label}>
            <div className="text-[64px] font-bold leading-none tracking-tight">
              {m.n}
            </div>
            <div className="mt-3 text-[12px] text-gray-500 uppercase tracking-wide">
              {m.label}
            </div>
          </div>
        ))}
      </section>

      <QuestionSection
        number={1}
        title="Have you ever eaten a gas station hot dog?"
      >
        <HBar data={Q1_DATA} width={260} />
      </QuestionSection>

      <QuestionSection
        number={2}
        title="Rate your go-to gas station on food quality."
      >
        <div className="space-y-6">
          <div>
            <div className="text-[64px] font-bold leading-none tracking-tight">
              {Q2_AVG.toFixed(1)}
              <span className="text-[24px] font-normal text-gray-500"> / 10</span>
            </div>
            <div className="mt-3 text-[12px] text-gray-500 uppercase tracking-wide">
              average score
            </div>
          </div>
          <ChartContainer
            config={barConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <BarChart
              data={Q2_DIST}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid vertical={false} stroke="hsl(0 0% 90%)" />
              <XAxis
                dataKey="score"
                stroke="hsl(0 0% 10%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(0 0% 40%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
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
              />
            </BarChart>
          </ChartContainer>
        </div>
      </QuestionSection>

      <QuestionSection
        number={3}
        title="Which of these have you eaten at a gas station?"
      >
        <HBar data={Q3_DATA} width={220} />
      </QuestionSection>

      <QuestionSection
        number={4}
        title="What's the best gas station chain for food?"
      >
        <HBar data={Q4_DATA} width={200} />
      </QuestionSection>

      <QuestionSection
        number={5}
        title="Describe your ideal gas station snack in one sentence."
      >
        <ul className="space-y-3">
          {Q5_RESPONSES.map((r, i) => (
            <li
              key={i}
              className="border-l-2 border-black pl-4 text-sm leading-relaxed"
            >
              {r}
            </li>
          ))}
        </ul>
      </QuestionSection>
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
    <section>
      <h2 className="mt-12 text-[11px] font-bold uppercase tracking-[0.15em] pb-2 border-b-4 border-black mb-6 rounded-none">
        Q{number} — {title}
      </h2>
      {children}
    </section>
  );
}

function HBar({
  data,
  width,
}: {
  data: { label: string; value: number }[];
  width: number;
}) {
  // Height scales with row count.
  const h = Math.max(180, data.length * 44);
  return (
    <ChartContainer
      config={barConfig}
      className="aspect-auto w-full"
      style={{ height: h }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 48, bottom: 8, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="hsl(0 0% 90%)" />
        <XAxis
          type="number"
          domain={[0, TOTAL]}
          stroke="hsl(0 0% 40%)"
          fontSize={11}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={width}
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
        />
      </BarChart>
    </ChartContainer>
  );
}
