import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CardRow, CardSortResponseData } from "@/lib/types";

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

  const { categories, byCard, total } = useMemo(() => {
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
      total: list.length,
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

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-base font-medium">By card</h3>
        <p className="text-sm text-muted-foreground">
          {total} response{total === 1 ? "" : "s"} across {cards.length} card
          {cards.length === 1 ? "" : "s"}.
        </p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium">Card</th>
                <th className="px-3 py-2 text-left font-medium">Most common</th>
                <th className="px-3 py-2 text-right font-medium">Agreement</th>
                <th className="px-3 py-2 text-left font-medium">Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.card.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{s.card.label}</td>
                  <td className="px-3 py-2">{s.topCategory}</td>
                  <td className="px-3 py-2 text-right">{s.agreement}%</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {Object.entries(s.counts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, n]) => `${cat} (${n})`)
                      .join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-medium">Matrix</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-medium" />
                {categories.map((c) => (
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
