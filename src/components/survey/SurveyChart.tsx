// Shared survey question visualization used by SurveyResults
// (which renders both real studies and canned examples).
//
// Chart rules:
//  - kind="binary"        → donut (exactly 2 options)
//  - kind="choice"        → horizontal bar
//  - kind="scale"         → vertical bar + average stat
//  - kind="text"          → quoted list

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Stat } from "@/components/study/primitives";



const AXIS_COLOR = "hsl(var(--chart-axis))";
const GRID_COLOR = "hsl(var(--chart-grid))";
const AXIS_FONT = "'Calibre', ui-sans-serif, system-ui, sans-serif";
const CHART_HEIGHT = 240;
// Tight margins so the plotted area uses the full container width.
const CHART_MARGIN = { top: 8, right: 8, bottom: 0, left: 0 };

// Shared ordered chart palette — every chart across all results pages should
// pull colors from this list in this order so visualizations feel related.
export const CHART_PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

// Donut palette for binary: first two slots of the shared palette.
const BINARY_COLORS = [CHART_PALETTE[0], CHART_PALETTE[1]];

const barConfig = {
  value: { label: "Responses", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export type CountMap = Record<string, number>;

// ---------- public components ----------

export function ChoiceChart({
  options,
  counts,
  total,
}: {
  options: string[];
  counts: CountMap;
  total: number;
}) {
  // Always show all configured options, including zero-count ones, in given order.
  const data = options.map((label) => ({ label, value: counts[label] ?? 0 }));
  // Append any extras (answers that aren't in `options`).
  Object.keys(counts).forEach((k) => {
    if (!options.includes(k)) data.push({ label: k, value: counts[k] });
  });

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers.</p>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const domainMax = Math.max(total, max, 1);

  return (
    <ul className="w-full space-y-3">
      {data.map((d) => {
        const widthPct = (d.value / domainMax) * 100;
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <li key={d.label} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">{d.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {d.value} · {pct}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-sm bg-[hsl(var(--chart-grid))]">
              <div
                className="h-full rounded-sm bg-primary transition-[width]"
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function BinaryDonut({
  options,
  counts,
  total,
}: {
  options: string[];
  counts: CountMap;
  total: number;
}) {
  const data = options.map((label) => ({ label, value: counts[label] ?? 0 }));
  const sum = data.reduce((s, d) => s + d.value, 0);
  if (sum === 0) {
    return <p className="text-sm text-muted-foreground">No answers.</p>;
  }

  // If options are Yes/No, force Yes=blue No=red. Otherwise color by index.
  const yesIndex = options.findIndex((o) => /^(yes|true)$/i.test(o));
  const colorFor = (i: number) => {
    if (yesIndex === 0) return BINARY_COLORS[i === 0 ? 0 : 1];
    if (yesIndex === 1) return BINARY_COLORS[i === 1 ? 0 : 1];
    return BINARY_COLORS[i % BINARY_COLORS.length];
  };

  // Build a chart config so labels show in tooltip.
  const config: ChartConfig = {};
  data.forEach((d, i) => {
    config[d.label] = { label: d.label, color: colorFor(i) };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-12">
      <ChartContainer
        config={config}
        className="aspect-square w-full max-w-[260px]"
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const n = Number(value);
                  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                  return (
                     <div className="flex w-full justify-between gap-4">
                       <span>{String(name)}</span>
                       <span className="font-medium tabular-nums">
                         {n} · {pct}%
                       </span>
                     </div>
                  );
                }}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="55%"
            outerRadius="85%"
            stroke="hsl(var(--background))"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colorFor(i)} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="space-y-2 text-sm">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li
              key={d.label}
              className="grid grid-cols-[12px_120px_3rem_3rem] items-center gap-x-3"
            >
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: colorFor(i) }}
              />
              <span>{d.label}</span>
              <span className="text-right tabular-nums text-muted-foreground">
                 {d.value}
               </span>
               <span className="text-right tabular-nums text-muted-foreground">
                 {pct}%
               </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ScaleChart({
  min,
  max,
  counts,
}: {
  min: number;
  max: number;
  counts: CountMap;
}) {
  const data = [];
  for (let n = min; n <= max; n++) {
    const key = String(n);
    data.push({ score: key, value: counts[key] ?? 0 });
  }
  const maxCount = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);
  const avg =
    total > 0
      ? data.reduce((s, d) => s + Number(d.score) * d.value, 0) / total
      : 0;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="shrink-0 sm:w-32">
        <Stat
          label="Average"
          value={
            <>
              {avg.toFixed(1)}
              <span className="ml-1 text-[18px] font-normal text-muted-foreground">
                / {max}
              </span>
            </>
          }
          tone="neutral"
          className="py-0"
        />
      </div>
      <ChartContainer
        config={barConfig}
        className="aspect-auto w-full flex-1"
        style={{ height: CHART_HEIGHT }}
      >
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
          <XAxis
            dataKey="score"
            stroke={AXIS_COLOR}
            fontSize={12}
            fontFamily={AXIS_FONT}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={AXIS_COLOR}
            fontSize={12}
            fontFamily={AXIS_FONT}
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
                     <span className="font-medium tabular-nums">{value}</span>
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
  );
}

export function TextResponses({ responses }: { responses: string[] }) {
  if (responses.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers.</p>;
  }
  return (
    <ul className="space-y-3">
      {responses.map((r, i) => (
        <li key={i} className="border-l-2 pl-4 text-sm leading-relaxed">
          {r}
        </li>
      ))}
    </ul>
  );
}

// ---------- top-level chooser ----------

export type SurveyChartProps =
  | {
      kind: "choice";
      options: string[];
      counts: CountMap;
      total: number;
    }
  | {
      kind: "scale";
      min: number;
      max: number;
      counts: CountMap;
    }
  | {
      kind: "text";
      responses: string[];
    };

/**
 * Render the right chart for a question. Binary detection (donut vs bar)
 * happens automatically when kind="choice" and options.length === 2.
 */
export function SurveyChart(props: SurveyChartProps) {
  if (props.kind === "text") {
    return <TextResponses responses={props.responses} />;
  }
  if (props.kind === "scale") {
    return <ScaleChart min={props.min} max={props.max} counts={props.counts} />;
  }
  // choice: donut for exactly 2 options, bar otherwise.
  if (props.options.length === 2) {
    return (
      <BinaryDonut
        options={props.options}
        counts={props.counts}
        total={props.total}
      />
    );
  }
  return (
    <ChoiceChart
      options={props.options}
      counts={props.counts}
      total={props.total}
    />
  );
}
