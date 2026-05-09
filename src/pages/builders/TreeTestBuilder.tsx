import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateSlug } from "@/lib/slug";
import { StudyStatus, TreeTestConfig, TreeTestTask } from "@/lib/types";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import { useRegisterStudyActions } from "@/components/StudyToolbarContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface Props {
  studyId: string;
  onMetaChange?: (meta: { title: string; description: string }) => void;
  initial: {
    title: string;
    description: string | null;
    status: StudyStatus;
    slug: string | null;
    config: TreeTestConfig;
  };
}

interface DraftNode {
  id: string;
  parent_id: string | null;
  label: string;
  position: number;
  persisted: boolean;
}

/* ── Sortable tree row ──────────────────────────────────────── */
function SortableNode({
  node,
  depth,
  hasChildren,
  isCollapsed,
  onToggle,
  onUpdate,
  onAddChild,
  onRemove,
  isCorrectFor,
  onSetCorrect,
}: {
  node: DraftNode;
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  onUpdate: (label: string) => void;
  onAddChild: () => void;
  onRemove: () => void;
  isCorrectFor: string | null; // task id this node is correct for, or null
  onSetCorrect: (nodeId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 24 + 4}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 py-1",
        isDragging && "opacity-50",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {hasChildren ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      ) : (
        <span className="inline-block w-7 shrink-0" />
      )}

      <Input
        placeholder="Node label"
        value={node.label}
        onChange={(e) => onUpdate(e.target.value)}
        className="h-9"
      />

      <Button variant="ghost" size="sm" onClick={onAddChild} title="Add child">
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ── Main builder ────────────────────────────────────────────── */
export default function TreeTestBuilder({ studyId, initial, onMetaChange }: Props) {
  const navigate = useNavigate();
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitleState] = useState(initial.title);
  const [description, setDescriptionState] = useState(initial.description ?? "");
  const setTitle = (v: string) => {
    setTitleState(v);
    onMetaChange?.({ title: v, description });
  };
  const setDescription = (v: string) => {
    setDescriptionState(v);
    onMetaChange?.({ title, description: v });
  };
  const [status, setStatus] = useState<StudyStatus>(initial.status);
  const [slug, setSlug] = useState<string | null>(initial.slug);

  // Tasks
  const [tasks, setTasks] = useState<TreeTestTask[]>(() => {
    // Migrate legacy single-task config
    if (initial.config.tasks?.length) return initial.config.tasks;
    if (initial.config.task) {
      return [
        {
          id: crypto.randomUUID(),
          text: initial.config.task,
          correct_node_id: initial.config.correct_node_id ?? "",
        },
      ];
    }
    return [];
  });

  // Nodes
  const [nodes, setNodes] = useState<DraftNode[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Currently-selecting correct node for which task?
  const [selectingCorrectFor, setSelectingCorrectFor] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tree_nodes")
        .select("id, parent_id, label, position")
        .eq("study_id", studyId)
        .order("position");
      setNodes(
        (data ?? []).map((n) => ({
          id: n.id,
          parent_id: n.parent_id,
          label: n.label,
          position: n.position,
          persisted: true,
        })),
      );
      setLoadingChildren(false);
    })();
  }, [studyId]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, DraftNode[]>();
    for (const n of nodes) {
      const key = n.parent_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    for (const [, list] of map) list.sort((a, b) => a.position - b.position);
    return map;
  }, [nodes]);

  const toggle = (id: string) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const addNode = (parent_id: string | null) => {
    const siblings = nodes.filter((n) => n.parent_id === parent_id);
    const newNode: DraftNode = {
      id: crypto.randomUUID(),
      parent_id,
      label: "",
      position: siblings.length,
      persisted: false,
    };
    setNodes((ns) => [...ns, newNode]);
    if (parent_id) setCollapsed((c) => ({ ...c, [parent_id]: false }));
  };

  const updateNode = (id: string, label: string) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, label } : n)));
  };

  const removeNode = (id: string) => {
    const toRemove = new Set<string>();
    const walk = (nid: string) => {
      toRemove.add(nid);
      for (const n of nodes) if (n.parent_id === nid) walk(n.id);
    };
    walk(id);
    const persistedToDelete = nodes
      .filter((n) => toRemove.has(n.id) && n.persisted)
      .map((n) => n.id);
    if (persistedToDelete.length) {
      setDeletedIds((d) => [...d, ...persistedToDelete]);
    }
    setNodes((ns) => ns.filter((n) => !toRemove.has(n.id)));
    // Clear any tasks referencing deleted nodes
    setTasks((ts) =>
      ts.map((t) => (toRemove.has(t.correct_node_id) ? { ...t, correct_node_id: "" } : t)),
    );
  };

  /* Drag-and-drop reorder within same parent */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeNode = nodes.find((n) => n.id === active.id);
    const overNode = nodes.find((n) => n.id === over.id);
    if (!activeNode || !overNode || activeNode.parent_id !== overNode.parent_id) return;
    const parentId = activeNode.parent_id;
    const siblings = (childrenByParent.get(parentId) ?? []).map((n) => n.id);
    const oldIndex = siblings.indexOf(active.id as string);
    const newIndex = siblings.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(siblings, oldIndex, newIndex);
    setNodes((ns) =>
      ns.map((n) => {
        if (n.parent_id !== parentId) return n;
        const idx = reordered.indexOf(n.id);
        return idx >= 0 ? { ...n, position: idx } : n;
      }),
    );
  };

  /* ── Tasks management ──────────────────────────────────────── */
  const addTask = () => {
    setTasks((ts) => [...ts, { id: crypto.randomUUID(), text: "", correct_node_id: "" }]);
  };
  const updateTask = (id: string, patch: Partial<TreeTestTask>) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };
  const removeTask = (id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  /* ── Persist ───────────────────────────────────────────────── */
  const persistChildren = async () => {
    if (deletedIds.length) {
      const { error } = await supabase.from("tree_nodes").delete().in("id", deletedIds);
      if (error) throw error;
      setDeletedIds([]);
    }
    if (nodes.length) {
      const grouped = new Map<string | null, DraftNode[]>();
      for (const n of nodes) {
        const key = n.parent_id;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(n);
      }
      const rows: {
        id: string;
        study_id: string;
        parent_id: string | null;
        label: string;
        position: number;
      }[] = [];
      for (const [, siblings] of grouped) {
        siblings.sort((a, b) => a.position - b.position);
        siblings.forEach((n, i) => {
          rows.push({
            id: n.id,
            study_id: studyId,
            parent_id: n.parent_id,
            label: n.label.trim() || "Untitled",
            position: i,
          });
        });
      }
      const { error } = await supabase.from("tree_nodes").upsert(rows);
      if (error) throw error;
    }
    setNodes((ns) => ns.map((n) => ({ ...n, persisted: true })));
  };

  const save = async (
    overrides: Partial<{ status: StudyStatus; slug: string | null }> = {},
  ) => {
    setSaving(true);
    try {
      const { data: existing, error: checkErr } = await supabase
        .from("studies")
        .select("id")
        .eq("id", studyId)
        .maybeSingle();
      if (checkErr) throw new Error(checkErr.message);
      if (!existing) {
        toast.error("This study no longer exists. Redirecting…");
        navigate("/");
        return null;
      }
      const config: TreeTestConfig = { tasks };
      const payload = {
        title: title.trim() || "Untitled study",
        description: description.trim() || null,
        config: config as unknown as never,
        status: overrides.status ?? status,
        slug: overrides.slug !== undefined ? overrides.slug : slug,
      };
      const { error: updateErr } = await supabase
        .from("studies")
        .update(payload)
        .eq("id", studyId);
      if (updateErr) throw new Error(updateErr.message);
      await persistChildren();
      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast.error(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    const roots = nodes.filter((n) => n.parent_id === null);
    if (roots.length === 0) {
      toast.error("Add at least one top-level node");
      return false;
    }
    if (nodes.some((n) => !n.label.trim())) {
      toast.error("All nodes need a label");
      return false;
    }
    if (tasks.length === 0) {
      toast.error("Add at least one task");
      return false;
    }
    if (tasks.some((t) => !t.text.trim())) {
      toast.error("All tasks need a description");
      return false;
    }
    if (tasks.some((t) => !t.correct_node_id)) {
      toast.error("Set the correct answer for every task");
      return false;
    }
    const newSlug = slug ?? generateSlug();
    const ok = await save({ status: "live", slug: newSlug });
    if (ok) {
      setStatus("live");
      setSlug(newSlug);
      return true;
    }
    return false;
  };

  const handleDelete = useCallback(async () => {
    const { error } = await supabase.from("studies").delete().eq("id", studyId);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Study deleted");
  }, [studyId]);

  useRegisterStudyActions({ studyId, onSave: handleSave, onDelete: handleDelete, saving });

  if (loadingChildren) {
    return <p className="py-6 text-sm text-muted-foreground">Loading…</p>;
  }

  const nodeLabel = (id: string) => nodes.find((n) => n.id === id)?.label || id;

  // Flatten the tree into a list with hierarchical paths for the dropdown.
  const flatNodes: { id: string; path: string; depth: number }[] = [];
  const walkFlat = (parentId: string | null, depth: number, prefix: string[]) => {
    const list = childrenByParent.get(parentId) ?? [];
    for (const n of list) {
      const label = n.label.trim() || "(untitled)";
      const path = [...prefix, label].join(" / ");
      flatNodes.push({ id: n.id, path, depth });
      walkFlat(n.id, depth + 1, [...prefix, label]);
    }
  };
  walkFlat(null, 0, []);

  /* ── Render tree recursively ────────────────────────────── */
  const collectIds = (parentId: string | null): string[] => {
    const list = childrenByParent.get(parentId) ?? [];
    return list.map((n) => n.id);
  };

  const renderTree = (parentId: string | null, depth: number): React.ReactNode => {
    const list = childrenByParent.get(parentId) ?? [];
    if (list.length === 0) return null;
    const ids = list.map((n) => n.id);
    return (
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={depth > 0 ? "border-l border-border" : ""}>
          {list.map((n) => {
            const kids = childrenByParent.get(n.id) ?? [];
            const isCollapsed = collapsed[n.id] ?? false;
            const correctFor = tasks.find((t) => t.correct_node_id === n.id)?.id ?? null;
            return (
              <div key={n.id}>
                <div className="flex items-center">
                  <div className="flex-1">
                    <SortableNode
                      node={n}
                      depth={depth}
                      hasChildren={kids.length > 0}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggle(n.id)}
                      onUpdate={(label) => updateNode(n.id, label)}
                      onAddChild={() => addNode(n.id)}
                      onRemove={() => removeNode(n.id)}
                      isCorrectFor={correctFor}
                      onSetCorrect={() => {}}
                    />
                  </div>
                </div>
                {!isCollapsed && renderTree(n.id, depth + 1)}
              </div>
            );
          })}
        </div>
      </SortableContext>
    );
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief context shown to participants."
          />
        </div>
      </section>

      {/* Tree structure */}
      <section className="space-y-4">
        <h2>Tree structure</h2>

        {nodes.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {renderTree(null, 0)}
          </DndContext>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => addNode(null)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add top-level node
          </Button>
        </div>
      </section>

      {/* Tasks */}
      <section className="space-y-4">
        <h2>Tasks</h2>

        <ul className="space-y-3">
          {tasks.map((t, i) => (
            <li key={t.id} className="group rounded-md border p-4 bg-background">
              <div className="flex items-start gap-3">
                <div className="mt-2 text-sm text-muted-foreground">{i + 1}.</div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Task</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      onClick={() => removeTask(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Find where you would go to reset your password."
                    value={t.text}
                    onChange={(e) => updateTask(t.id, { text: e.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground shrink-0">Correct answer</span>
                    <Select
                      value={t.correct_node_id || ""}
                      onValueChange={(v) => updateTask(t.id, { correct_node_id: v })}
                    >
                      <SelectTrigger className="ml-auto h-9 max-w-xs">
                        <SelectValue placeholder="Select a node…" />
                      </SelectTrigger>
                      <SelectContent>
                        {flatNodes.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Add nodes to the tree first.
                          </div>
                        ) : (
                          flatNodes.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                              <span style={{ paddingLeft: `${n.depth * 12}px` }}>{n.path}</span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={addTask}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add task
          </Button>
        </div>
      </section>
    </div>
  );
}
