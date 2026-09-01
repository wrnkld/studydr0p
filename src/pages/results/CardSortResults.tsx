import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardRow, CardSortResponseData } from "@/lib/types";
import { Kicker } from "@/components/study/primitives";

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

const CHART_PALETTE = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

/** Simple plural -> singular for display grouping. No fuzzy matching. */
function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (/[^aeiou]ies$/.test(word)) return word.slice(0, -3) + "y";
  if (/(s|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (/[^s]s$/.test(word) && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

function Segment({
  color,
  cat,
  count,
  widthPct,
}: {
  color: string;
  cat: string;
  count: number;
  widthPct: string;
}) {
  const [tip, setTip] = useState({ show: false, x: 0, y: 0 });
  return (
    <div
      className="relative h-full"
      style={{ width: widthPct }}
      onMouseEnter={(e) => setTip({ show: true, x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => setTip({ show: true, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setTip((t) => ({ ...t, show: false }))}
      aria-label={`${cat}: ${count}`}
    >
      <div className="h-full" style={{ backgroundColor: color }} />
      {tip.show && (
        <div
          className="fixed z-50 flex items-center gap-2 rounded-lg border bg-popover px-3 py-1.5 text-base text-popover-foreground shadow-md pointer-events-none"
          style={{ left: tip.x + 12, top: tip.y - 40 }}
        >
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium">{cat}</span>
          <span className="font-medium tabular-nums">{count}</span>
        </div>
      )}
    </div>
  );
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

  const { categories, chartData, byCard, colorByCategory, maxCardTotal } = useMemo(() => {
    const list = rows ?? [];
    // Display-time only: derive a bucket key so trivially different spellings
    // ("Payments", "payment methods ", "Payment.") group together. Stored data
    // keeps the participant's raw label untouched.
    const normalize = (raw: string) => {
      const base = raw
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[\s.,;:!?/&|-]+$/g, "")
        .trim();
      return base
        .split(" ")
        .map((word) => singularize(word))
        .join(" ");
    };

    // key -> { originals: label -> count, byCard: cardId -> count }
    const buckets: Record<string, { originals: Record<string, number>; cards: Record<string, number> }> = {};

    list.forEach((r) => {
      const data = r.data as unknown as CardSortResponseData;
      (data.groups ?? []).forEach((g) => {
        const original = (g.category_label || "").trim() || "(unnamed)";
        const key = normalize(original) || "(unnamed)";
        const bucket = (buckets[key] ??= { originals: {}, cards: {} });
        bucket.originals[original] = (bucket.originals[original] ?? 0) + 1;
        g.card_ids.forEach((cid) => {
          bucket.cards[cid] = (bucket.cards[cid] ?? 0) + 1;
        });
      });
    });

    // Most common original spelling wins as the display label.
    const labelForKey: Record<string, string> = {};
    Object.entries(buckets).forEach(([key, b]) => {
      const best = Object.entries(b.originals).sort(
        (a, c) => c[1] - a[1] || a[0].localeCompare(c[0]),
      )[0];
      labelForKey[key] = best ? best[0] : key;
    });

    const keys = Object.keys(buckets);
    const categories = keys.map((k) => labelForKey[k]);

    const byCard: Record<string, Record<string, number>> = {};
    keys.forEach((k) => {
      const label = labelForKey[k];
      Object.entries(buckets[k].cards).forEach(([cid, n]) => {
        if (!byCard[cid]) byCard[cid] = {};
        byCard[cid][label] = (byCard[cid][label] ?? 0) + n;
      });
    });

    const colorByCategory = Object.fromEntries(
      categories.map((c, i) => [c, CHART_PALETTE[i % CHART_PALETTE.length]]),
    );

    const chartData = cards.map((card) => {
      const counts = byCard[card.id] ?? {};
      const entry: Record<string, string | number> = { name: card.label };
      categories.forEach((c) => {
        entry[c] = counts[c] ?? 0;
      });
      return entry;
    });

    const maxCardTotal = Math.max(
      ...chartData.map((entry) =>
        categories.reduce((sum, cat) => sum + ((entry[cat] as number) ?? 0), 0)
      ),
      1
    );

    return { categories, chartData, byCard, colorByCategory, maxCardTotal };
  }, [rows, cards]);


  if (loading) return <div className="text-base text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-base text-muted-foreground">No responses yet.</div>;
  }
  if (categories.length === 0) {
    return <div className="text-base text-muted-foreground">No sorted cards yet.</div>;
  }

  const colorFor = (cat: string) => colorByCategory[cat] ?? CHART_PALETTE[0];

  return (
    <div className="space-y-8">
      {/* ---------- Stacked bar chart ---------- */}
      <section className="space-y-3">
        <Kicker>By card</Kicker>

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

        <ul className="w-full space-y-3">
          {chartData.map((entry) => {
            const cardTotal = categories.reduce(
              (sum, cat) => sum + ((entry[cat] as number) ?? 0),
              0
            );
            const barWidth = maxCardTotal > 0 ? (cardTotal / maxCardTotal) * 100 : 0;

            return (
              <li key={entry.name} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-base">
                  <span className="truncate font-medium">{entry.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {cardTotal} {cardTotal === 1 ? "response" : "responses"}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-lg bg-[hsl(var(--chart-grid))]">
                  <div
                    className="flex h-full rounded-lg"
                    style={{ width: `${barWidth}%` }}
                  >
                    {categories.map((cat) => {
                      const count = (entry[cat] as number) ?? 0;
                      if (count === 0) return null;
                      const segWidth = cardTotal > 0 ? (count / cardTotal) * 100 : 0;
                      return (
                        <Segment
                          key={cat}
                          color={colorFor(cat)}
                          cat={cat}
                          count={count}
                          widthPct={`${segWidth}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Matrix table ---------- */}
      <section className="space-y-3">
        <Kicker>Matrix</Kicker>
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
                                : `hsl(var(--chart-3) / ${alpha.toFixed(3)})`,
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
