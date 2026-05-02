import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardRow, CardSortResponseData } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const { categories, byCard } = useMemo(() => {
    const list = rows ?? [];
    const catSet = new Set<string>();
    // card_id -> category_label -> count
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
    return {
      categories: Array.from(catSet),
      byCard,
    };
  }, [rows]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }

  if (categories.length === 0) {
    return <div className="text-sm text-muted-foreground">No sorted cards yet.</div>;
  }

  const summary = cards.map((card) => {
    const counts = byCard[card.id] ?? {};
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    const placedTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    const agreement = top && placedTotal > 0 ? Math.round((top[1] / placedTotal) * 100) : 0;
    return {
      card,
      counts,
      topCategory: top?.[0] ?? "—",
      agreement,
    };
  });

  // Color palette pulled from design tokens (chart-1..chart-5).
  const palette = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];
  const colorFor = (cat: string) =>
    palette[categories.indexOf(cat) % palette.length];

  // Per-card category breakdown for the minimal segmented bars.
  const distribution = summary.map((s) => {
    const total = Object.values(s.counts).reduce((a, b) => a + b, 0);
    const segments = categories
      .map((c) => ({ label: c, value: s.counts[c] ?? 0 }))
      .filter((seg) => seg.value > 0)
      .sort((a, b) => b.value - a.value);
    return { card: s.card, total, segments };
  });

  // Merge summary + distribution into one row per card.
  const rowsByCard = summary.map((s) => {
    const dist = distribution.find((d) => d.card.id === s.card.id)!;
    return { ...s, total: dist.total, segments: dist.segments };
  });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-medium">By card</h3>
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
        </div>

        <ul className="space-y-2">
          {rowsByCard.map((r) => (
            <li
              key={r.card.id}
              className="rounded-lg border bg-card px-4 py-3.5 space-y-2"
            >
              <span className="truncate text-sm font-medium">{r.card.label}</span>
              <div
                className="group relative flex h-4 w-full items-center"
                role="img"
                aria-label={`${r.card.label} placement distribution`}
              >
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted transition-all group-hover:h-2.5">
                  {r.total > 0 && (
                    <TooltipProvider delayDuration={100}>
                      {r.segments.map((seg) => {
                        const pct = Math.round((seg.value / r.total) * 100);
                        return (
                          <Tooltip key={seg.label}>
                            <TooltipTrigger asChild>
                              <span
                                className="h-full cursor-default transition-opacity hover:opacity-80"
                                style={{
                                  width: `${(seg.value / r.total) * 100}%`,
                                  backgroundColor: colorFor(seg.label),
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <span className="font-medium">{seg.label}</span>
                              <span className="ml-2 text-muted-foreground">
                                {seg.value} · {pct}%
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <span className="truncate text-xs text-muted-foreground">
                <span className="font-mono tabular-nums text-foreground">
                  {r.agreement}%
                </span>{" "}
                {r.topCategory}
              </span>
              <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
                <span className="font-mono tabular-nums text-foreground">
                  {r.total}
                </span>{" "}
                {r.total === 1 ? "response" : "responses"}
              </span>
            </li>
          ))}
        </ul>
      </section>

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
