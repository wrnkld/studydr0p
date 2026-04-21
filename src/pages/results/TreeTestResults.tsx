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
import { TreeTestConfig } from "@/lib/types";

interface ResponseRow {
  id: string;
  session_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface TreeNodeRow {
  id: string;
  label: string;
}

interface Props {
  studyId: string;
  config: TreeTestConfig;
  responses?: ResponseRow[];
}

export default function TreeTestResults({ studyId, config, responses }: Props) {
  const [rows, setRows] = useState<ResponseRow[] | null>(responses ?? null);
  const [nodes, setNodes] = useState<TreeNodeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [respRes, nodesRes] = await Promise.all([
        responses
          ? Promise.resolve({ data: responses })
          : supabase
              .from("responses")
              .select("id, session_id, data, created_at")
              .eq("study_id", studyId)
              .order("created_at", { ascending: false }),
        supabase.from("tree_nodes").select("id, label").eq("study_id", studyId),
      ]);
      setRows((respRes.data ?? []) as ResponseRow[]);
      setNodes((nodesRes.data ?? []) as TreeNodeRow[]);
      setLoading(false);
    })();
  }, [studyId, responses]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }

  const labelFor = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Submitted</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Final answer</TableHead>
            <TableHead>Correct?</TableHead>
            <TableHead>Time (s)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const d = r.data as {
              selected_node_id?: string;
              correct?: boolean;
              time_ms?: number;
            };
            return (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {r.session_id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-sm">
                  {d.selected_node_id ? labelFor(d.selected_node_id) : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {typeof d.correct === "boolean"
                    ? d.correct
                      ? "✓"
                      : "✗"
                    : d.selected_node_id === config.correct_node_id
                      ? "✓"
                      : "✗"}
                </TableCell>
                <TableCell className="text-sm">
                  {typeof d.time_ms === "number" ? Math.round(d.time_ms / 100) / 10 : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
