import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreeTestConfig, TreeTestTask } from "@/lib/types";
import { SectionHeader, Stat, StatGrid } from "@/components/study/primitives";
import { ChoiceChart, BinaryDonut, type CountMap } from "@/components/survey/SurveyChart";

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

  // For example studies where nodes aren't in DB, build labels from responses
  const labelForAny = (id: string) => {
    const fromNodes = nodes.find((n) => n.id === id)?.label;
    if (fromNodes) return fromNodes;
    // Try to find from response data
    for (const r of rows ?? []) {
      const d = r.data as { tasks?: TaskResult[] };
      if (d.tasks) {
        for (const t of d.tasks) {
          if (t.selected_node_id === id && t.selected_label) return t.selected_label;
          const pathMatch = t.path?.find((p) => p.node_id === id);
          if (pathMatch) return pathMatch.label;
        }
      }
    }
    return id;
  };

  const taskAnalytics = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    return tasks.map((task) => {
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

      const avgClicks =
        total > 0
          ? Math.round(
              (results.reduce((sum, r) => sum + (r.path?.length ?? 0), 0) / total) * 10,
            ) / 10
          : 0;

      const direct = results.filter((r) => {
        if (r.selected_node_id !== task.correct_node_id) return false;
        const visited = r.path?.map((p) => p.node_id) ?? [];
        return new Set(visited).size === visited.length;
      }).length;
      const directness = total > 0 ? Math.round((direct / total) * 100) : 0;

      // Destination distribution as CountMap for ChoiceChart
      const destinations = new Map<string, number>();
      for (const r of results) {
        const label = labelForAny(r.selected_node_id);
        destinations.set(label, (destinations.get(label) ?? 0) + 1);
      }

      // Build sorted options list (correct answer first, then by count desc)
      const correctLabel = labelForAny(task.correct_node_id);
      const destEntries = Array.from(destinations.entries()).sort((a, b) => b[1] - a[1]);
      const options: string[] = [];
      const counts: CountMap = {};
      // Ensure correct answer is in the list
      if (!destinations.has(correctLabel)) {
        options.push(correctLabel);
        counts[correctLabel] = 0;
      }
      for (const [label, count] of destEntries) {
        options.push(label);
        counts[label] = count;
      }

      return {
        task,
        total,
        correct,
        successRate,
        avgClicks,
        directness,
        correctLabel,
        options,
        counts,
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
        <section key={ta.task.id} className="space-y-4">
          <SectionHeader
            kicker={`Task ${i + 1}`}
            title={ta.task.text}
          />

          <StatGrid cols={4}>
            <Stat label="Responses" value={ta.total} tone="neutral" />
            <Stat label="Success rate" value={`${ta.successRate}%`} tone={ta.successRate >= 70 ? "green" : ta.successRate >= 40 ? "amber" : "neutral"} />
            <Stat label="Avg clicks" value={ta.avgClicks} tone="neutral" />
            <Stat label="Directness" value={`${ta.directness}%`} tone={ta.directness >= 70 ? "green" : ta.directness >= 40 ? "amber" : "neutral"} />
          </StatGrid>

          {/* Success / Fail donut */}
          <BinaryDonut
            options={["Correct", "Incorrect"]}
            counts={{ Correct: ta.correct, Incorrect: ta.total - ta.correct }}
            total={ta.total}
          />

          {/* Destination distribution as horizontal bar chart */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/80 font-medium">
              Where people ended up
            </div>
            <ChoiceChart
              options={ta.options}
              counts={ta.counts}
              total={ta.total}
            />
            <p className="text-xs text-muted-foreground">
              Correct answer: <span className="font-medium text-foreground">{ta.correctLabel}</span>
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
