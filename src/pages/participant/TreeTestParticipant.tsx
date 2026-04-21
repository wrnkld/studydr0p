import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TreeTestConfig } from "@/lib/types";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";

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

export default function TreeTestParticipant({
  study,
  sessionId,
  startedAt,
  onDone,
}: Props) {
  const [nodes, setNodes] = useState<NodeRow[] | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<PathStep[]>([]);
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

  const recordVisit = (n: NodeRow) => {
    setPath((p) => [
      ...p,
      { node_id: n.id, label: n.label, at_ms: Date.now() - startedAt },
    ]);
  };

  const toggle = (n: NodeRow, hasChildren: boolean) => {
    if (!hasChildren) return;
    const isOpen = expanded.has(n.id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isOpen) next.delete(n.id);
      else next.add(n.id);
      return next;
    });
    if (!isOpen) recordVisit(n);
  };

  const submit = async (selected: NodeRow) => {
    setSubmitting(true);
    const finalPath: PathStep[] = [
      ...path,
      { node_id: selected.id, label: selected.label, at_ms: Date.now() - startedAt },
    ];
    const data = {
      task: study.config.task,
      selected_node_id: selected.id,
      selected_label: selected.label,
      path: finalPath,
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
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
          return (
            <li key={n.id} className={depth === 0 ? "" : ""}>
              <div
                className={`flex items-center gap-2 px-3 py-2 ${
                  depth > 0 ? "ml-4" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(n, hasKids)}
                  className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    hasKids
                      ? "hover:bg-accent"
                      : "cursor-default text-muted-foreground"
                  }`}
                  disabled={!hasKids}
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => submit(n)}
                  disabled={submitting}
                >
                  Select this
                </Button>
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
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl py-12">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Tree test
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{study.title}</h1>

        <div className="mt-8 rounded-lg border border-border bg-muted/30 p-5">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Your task
          </div>
          <p className="mt-2 whitespace-pre-wrap text-base">{study.config.task}</p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Click through the menu below. When you find your answer, click{" "}
          <span className="font-medium text-foreground">Select this</span>.
        </p>

        <div className="mt-4">{renderTree(null, 0)}</div>
      </main>
    </div>
  );
}
