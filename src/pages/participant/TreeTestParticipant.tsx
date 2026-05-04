import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TreeTestConfig, TreeTestTask } from "@/lib/types";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Kicker } from "@/components/study/primitives";

interface Props {
  study: {
    id: string;
    title: string;
    description: string | null;
    config: TreeTestConfig;
  };
  sessionId: string;
  startedAt: number;
  onDone: () => void;
}

interface NodeRow {
  id: string;
  parent_id: string | null;
  label: string;
  position: number;
}

interface PathStep {
  node_id: string;
  label: string;
  at_ms: number;
}

interface TaskResult {
  task_id: string;
  task_text: string;
  correct_node_id: string;
  selected_node_id: string;
  selected_label: string;
  path: PathStep[];
  duration_ms: number;
}

export default function TreeTestParticipant({
  study,
  sessionId,
  startedAt,
  onDone,
}: Props) {
  const tasks: TreeTestTask[] = useMemo(() => {
    if (study.config.tasks?.length) return study.config.tasks;
    // Legacy single-task
    if (study.config.task) {
      return [
        {
          id: "legacy",
          text: study.config.task,
          correct_node_id: study.config.correct_node_id ?? "",
        },
      ];
    }
    return [];
  }, [study.config]);

  const [nodes, setNodes] = useState<NodeRow[] | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<PathStep[]>([]);
  const [taskStartedAt, setTaskStartedAt] = useState(startedAt);
  const [selectedNode, setSelectedNode] = useState<NodeRow | null>(null);
  const [completedTasks, setCompletedTasks] = useState<TaskResult[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("tree_nodes")
        .select("id, parent_id, label, position")
        .eq("study_id", study.id)
        .order("position");
      if (error) {
        toast.error(error.message);
        return;
      }
      setNodes(data ?? []);
    })();
  }, [study.id]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, NodeRow[]>();
    for (const n of nodes ?? []) {
      const key = n.parent_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    for (const [, list] of map) list.sort((a, b) => a.position - b.position);
    return map;
  }, [nodes]);

  const currentTask = tasks[currentTaskIndex] ?? null;

  const recordClick = (n: NodeRow) => {
    setPath((p) => [
      ...p,
      { node_id: n.id, label: n.label, at_ms: Date.now() - startedAt },
    ]);
  };

  const handleNodeClick = (n: NodeRow) => {
    const kids = childrenByParent.get(n.id) ?? [];
    recordClick(n);
    if (kids.length > 0) {
      // Toggle expansion
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(n.id)) next.delete(n.id);
        else next.add(n.id);
        return next;
      });
      setSelectedNode(null);
    } else {
      // Leaf node — select it
      setSelectedNode(n);
    }
  };

  const confirmSelection = () => {
    if (!selectedNode || !currentTask) return;
    const result: TaskResult = {
      task_id: currentTask.id,
      task_text: currentTask.text,
      correct_node_id: currentTask.correct_node_id,
      selected_node_id: selectedNode.id,
      selected_label: selectedNode.label,
      path,
      duration_ms: Date.now() - taskStartedAt,
    };
    const newCompleted = [...completedTasks, result];
    setCompletedTasks(newCompleted);

    if (currentTaskIndex + 1 < tasks.length) {
      // Next task
      setCurrentTaskIndex((i) => i + 1);
      setExpanded(new Set());
      setPath([]);
      setSelectedNode(null);
      setTaskStartedAt(Date.now());
    } else {
      // All tasks done — submit
      submitAll(newCompleted);
    }
  };

  const submitAll = async (results: TaskResult[]) => {
    setSubmitting(true);
    const data = {
      tasks: results,
      duration_ms: Date.now() - startedAt,
    };
    const { error: respErr } = await supabase.from("responses").insert({
      study_id: study.id,
      session_id: sessionId,
      data: data as unknown as never,
    });
    if (respErr) {
      setSubmitting(false);
      toast.error(respErr.message);
      return;
    }
    await supabase
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
        metadata: { duration_ms: Date.now() - startedAt },
      })
      .eq("id", sessionId);
    setSubmitting(false);
    onDone();
  };

  if (!nodes) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-sm text-muted-foreground">No tasks configured.</div>
      </div>
    );
  }

  const renderTree = (parentId: string | null, depth: number) => {
    const list = childrenByParent.get(parentId) ?? [];
    if (list.length === 0) return null;
    return (
      <ul
        className={
          depth === 0
            ? "divide-y divide-border rounded-lg border border-border bg-card"
            : "border-l border-border"
        }
      >
        {list.map((n) => {
          const kids = childrenByParent.get(n.id) ?? [];
          const hasKids = kids.length > 0;
          const isOpen = expanded.has(n.id);
          const isSelected = selectedNode?.id === n.id;
          return (
            <li key={n.id}>
              <div
                className={`flex items-center gap-2 px-3 py-2 ${depth > 0 ? "ml-4" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => handleNodeClick(n)}
                  className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-accent ring-2 ring-ring"
                      : "hover:bg-accent"
                  }`}
                >
                  {hasKids ? (
                    isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )
                  ) : (
                    <span className="inline-block w-4 shrink-0" />
                  )}
                  <span className="text-foreground">{n.label}</span>
                </button>
              </div>
              {hasKids && isOpen && (
                <div className="pb-2 pl-4">{renderTree(n.id, depth + 1)}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-5">
        <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Task {currentTaskIndex + 1} of {tasks.length}
        </div>
        <p className="mt-2 whitespace-pre-wrap text-base">{currentTask.text}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        Click through the menu below. When you find your answer, click it to select, then confirm.
      </p>

      <div>{renderTree(null, 0)}</div>

      {selectedNode && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <span className="text-sm">
            Selected: <span className="font-medium text-foreground">{selectedNode.label}</span>
          </span>
          <Button
            size="sm"
            onClick={confirmSelection}
            disabled={submitting}
            className="ml-auto"
          >
            {currentTaskIndex + 1 < tasks.length
              ? "Confirm & next task"
              : "Confirm & submit"}
          </Button>
        </div>
      )}
    </div>
  );
}
