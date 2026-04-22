import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import { StudyStatus, TreeTestConfig } from "@/lib/types";
import { ArrowLeft, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

interface Props {
  studyId: string;
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

export default function TreeTestBuilder({ studyId, initial }: Props) {
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [task, setTask] = useState(initial.config.task ?? "");
  const [status, setStatus] = useState<StudyStatus>(initial.status);
  const [slug, setSlug] = useState<string | null>(initial.slug);
  const [nodes, setNodes] = useState<DraftNode[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

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

  // Group children by parent_id for rendering
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

  const updateNode = (id: string, patch: Partial<DraftNode>) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const removeNode = (id: string) => {
    // collect this node + all descendants
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
  };

  const persistChildren = async () => {
    if (deletedIds.length) {
      const { error } = await supabase
        .from("tree_nodes")
        .delete()
        .in("id", deletedIds);
      if (error) throw error;
      setDeletedIds([]);
    }
    if (nodes.length) {
      // Re-number positions per sibling group
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
      await persistChildren();
      const config: TreeTestConfig = {
        task: task.trim(),
        correct_node_id: initial.config.correct_node_id ?? "",
      };
      const payload = {
        title: title.trim() || "Untitled study",
        description: description.trim() || null,
        config: config as unknown as never,
        status: overrides.status ?? status,
        slug: overrides.slug !== undefined ? overrides.slug : slug,
      };
      const { error } = await supabase
        .from("studies")
        .update(payload)
        .eq("id", studyId);
      if (error) throw error;
      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      toast.error(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    const ok = await save();
    if (ok) toast.success("Saved");
  };

  const handlePublish = async () => {
    if (!task.trim()) {
      toast.error("Add a task prompt");
      return;
    }
    const roots = nodes.filter((n) => n.parent_id === null);
    if (roots.length === 0) {
      toast.error("Add at least one top-level node");
      return;
    }
    if (nodes.some((n) => !n.label.trim())) {
      toast.error("All nodes need a label");
      return;
    }
    const newSlug = slug ?? generateSlug();
    const ok = await save({ status: "live", slug: newSlug });
    if (ok) {
      setStatus("live");
      setSlug(newSlug);
      toast.success("Published");
    }
  };

  const handleClose = async () => {
    const ok = await save({ status: "closed" });
    if (ok) {
      setStatus("closed");
      toast.success("Study closed");
    }
  };

  const shareUrl = slug ? `${window.location.origin}/s/${slug}` : null;

  if (loadingChildren) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const renderTree = (parentId: string | null, depth: number) => {
    const list = childrenByParent.get(parentId) ?? [];
    if (list.length === 0) return null;
    return (
      <ul className={depth === 0 ? "space-y-2" : "mt-2 space-y-2 border-l border-border pl-4"}>
        {list.map((n) => {
          const kids = childrenByParent.get(n.id) ?? [];
          const isCollapsed = collapsed[n.id] ?? false;
          return (
            <li key={n.id}>
              <div className="flex items-center gap-1.5">
                {kids.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => toggle(n.id)}
                    aria-label={isCollapsed ? "Expand" : "Collapse"}
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
                  value={n.label}
                  onChange={(e) => updateNode(n.id, { label: e.target.value })}
                  className="h-9"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addNode(n.id)}
                  title="Add child"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => removeNode(n.id)}
                  aria-label="Remove node"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {!isCollapsed && renderTree(n.id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-10">
        <Link
          to="/studies"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard
        </Link>

        <div className="mt-6 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Edit tree test</h1>
          <span className="text-xs text-muted-foreground">Status: {status}</span>
        </div>

        <section className="mt-8 space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="task">Task prompt</Label>
            <Textarea
              id="task"
              rows={3}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g. Where would you go to update your billing address?"
            />
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Tree structure
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Build your sitemap. Click + on any row to add a child.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => addNode(null)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add top-level
            </Button>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            {nodes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No nodes yet. Add a top-level node to get started.
              </p>
            ) : (
              renderTree(null, 0)
            )}
          </div>
        </section>

        {shareUrl && status === "live" && (
          <section className="mt-10 rounded-lg border border-border p-5">
            <div className="text-sm font-medium">Share link</div>
            <div className="mt-2 flex gap-2">
              <Input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Copied");
                }}
              >
                Copy
              </Button>
            </div>
          </section>
        )}

        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          {status !== "live" && (
            <Button onClick={handlePublish} disabled={saving}>
              {status === "closed" ? "Re-publish" : "Publish"}
            </Button>
          )}
          {status === "live" && (
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Close study
            </Button>
          )}
          {status === "live" && slug && (
            <Button asChild variant="ghost">
              <a href={`/s/${slug}`} target="_blank" rel="noreferrer">
                Preview
              </a>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
