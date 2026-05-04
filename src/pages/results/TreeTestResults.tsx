import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreeTestConfig, TreeTestTask } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResponseRow {
  id: string;
  session_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface TreeNodeRow {
  id: string;
  parent_id: string | null;
  label: string;
}

interface TaskResult {
  task_id: string;
  task_text: string;
  correct_node_id: string;
  selected_node_id: string;
  selected_label: string;
  path: { node_id: string; label: string; at_ms: number }[];
  duration_ms: number;
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

  const tasks: TreeTestTask[] = useMemo(() => {
    if (config.tasks?.length) return config.tasks;
    if (config.task) {
      return [
        { id: "legacy", text: config.task, correct_node_id: config.correct_node_id ?? "" },
      ];
    }
    return [];
  }, [config]);

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
        supabase.from("tree_nodes").select("id, parent_id, label").eq("study_id", studyId),
      ]);
      setRows((respRes.data ?? []) as ResponseRow[]);
      setNodes((nodesRes.data ?? []) as TreeNodeRow[]);
      setLoading(false);
    })();
  }, [studyId, responses]);

  const labelFor = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;

  // Extract per-task results from all responses
  const taskAnalytics = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    return tasks.map((task) => {
      // Collect task results from all responses
      const results: TaskResult[] = [];
      for (const r of rows) {
        const d = r.data as { tasks?: TaskResult[] };
        if (d.tasks) {
          const tr = d.tasks.find((t) => t.task_id === task.id);
          if (tr) results.push(tr);
        }
      }

      const total = results.length;
      const correct = results.filter(
        (r) => r.selected_node_id === task.correct_node_id,
      ).length;
      const successRate = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Average clicks
      const avgClicks =
        total > 0
          ? Math.round(
              (results.reduce((sum, r) => sum + (r.path?.length ?? 0), 0) / total) * 10,
            ) / 10
          : 0;

      // Directness: went straight to correct answer without backtracking
      const direct = results.filter((r) => {
        if (r.selected_node_id !== task.correct_node_id) return false;
        // Check no node was visited twice
        const visited = r.path?.map((p) => p.node_id) ?? [];
        return new Set(visited).size === visited.length;
      }).length;
      const directness = total > 0 ? Math.round((direct / total) * 100) : 0;

      // Destination distribution
      const destinations = new Map<string, number>();
      for (const r of results) {
        const key = r.selected_node_id;
        destinations.set(key, (destinations.get(key) ?? 0) + 1);
      }
      const sortedDest = Array.from(destinations.entries())
        .map(([nodeId, count]) => ({
          nodeId,
          label: labelFor(nodeId),
          count,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
          isCorrect: nodeId === task.correct_node_id,
        }))
        .sort((a, b) => b.count - a.count);

      const topWrong = sortedDest.filter((d) => !d.isCorrect).slice(0, 3);

      return {
        task,
        total,
        correct,
        successRate,
        avgClicks,
        directness,
        destinations: sortedDest,
        topWrong,
      };
    });
  }, [rows, tasks, nodes]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No responses yet.</div>;
  }

  return (
    <div className="space-y-8">
      {taskAnalytics.map((ta, i) => (
        <div key={ta.task.id} className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Task {i + 1}: {ta.task.text}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Correct answer: {labelFor(ta.task.correct_node_id)}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Responses" value={String(ta.total)} />
            <StatCard label="Success rate" value={`${ta.successRate}%`} />
            <StatCard label="Avg clicks" value={String(ta.avgClicks)} />
            <StatCard label="Directness" value={`${ta.directness}%`} />
          </div>

          {/* Destination distribution */}
          <div className="rounded-lg border border-border">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Where people ended up
              </span>
            </div>
            <div className="divide-y divide-border">
              {ta.destinations.map((d) => (
                <div
                  key={d.nodeId}
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 text-sm",
                    d.isCorrect && "bg-emerald-500/5",
                  )}
                >
                  <span
                    className={cn(
                      "font-medium",
                      d.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                    )}
                  >
                    {d.label}
                    {d.isCorrect && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                        ✓ Correct
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {d.count} ({d.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top wrong answers */}
          {ta.topWrong.length > 0 && (
            <div>
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Top wrong answers
              </span>
              <div className="mt-2 space-y-1">
                {ta.topWrong.map((w) => (
                  <div
                    key={w.nodeId}
                    className="flex items-center justify-between text-sm text-muted-foreground"
                  >
                    <span>{w.label}</span>
                    <span className="tabular-nums">
                      {w.count} ({w.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
