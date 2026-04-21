import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }

  // Flatten: one row per (response × placed card)
  const flat: { sessionId: string; submittedAt: string; card: string; category: string }[] = [];
  rows.forEach((r) => {
    const data = r.data as unknown as CardSortResponseData;
    (data.groups ?? []).forEach((g) => {
      g.card_ids.forEach((cid) => {
        const card = cards.find((c) => c.id === cid);
        flat.push({
          sessionId: r.session_id,
          submittedAt: r.created_at,
          card: card?.label ?? cid,
          category: g.category_label || "(unnamed)",
        });
      });
    });
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Card</TableHead>
            <TableHead>Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flat.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(row.submittedAt).toLocaleString()}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.sessionId.slice(0, 8)}
              </TableCell>
              <TableCell className="text-sm">{row.card}</TableCell>
              <TableCell className="text-sm">{row.category}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
