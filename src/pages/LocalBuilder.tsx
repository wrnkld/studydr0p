import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STUDY_TYPE_META,
  StudyType,
  CardSortConfig,
  SurveyConfig,
  SurveyQuestion,
  SurveyQuestionType,
} from "@/lib/types";
import {
  DraftStudy,
  DraftTreeNode,
  loadDraft,
  newDraft,
  saveDraft,
  clearDraft,
} from "@/lib/draftStudy";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, Plus, ArrowLeft, ImageIcon, Upload, Lock } from "lucide-react";
import SignInToPublishModal from "@/components/SignInToPublishModal";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/slug";

const VALID_TYPES: StudyType[] = ["card_sort", "survey"];

export default function LocalBuilder() {
  const { type: typeParam } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [draft, setDraft] = useState<DraftStudy | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Initialize draft: if a draft already exists for this type use it, else create new
  useEffect(() => {
    const existing = loadDraft();
    const requested = typeParam as StudyType | undefined;

    if (!requested) {
      // /build with no type — resume existing draft, or send to /
      if (existing) {
        setDraft(existing);
      } else {
        navigate("/", { replace: true });
      }
      return;
    }

    if (!VALID_TYPES.includes(requested)) {
      navigate("/", { replace: true });
      return;
    }

    // All 5 study types are supported in the local builder.

    // Reuse the saved draft only if it matches the requested type AND
    // already has the per-type slot populated (older drafts from before
    // we supported all 5 types may be missing it).
    const slotOk =
      existing &&
      existing.type === requested &&
      ((requested === "card_sort" && existing.cardSort) ||
        (requested === "survey" && existing.survey) ||
        (requested === "first_click" && existing.firstClick) ||
        (requested === "tree_test" && existing.treeTest) ||
        (requested === "five_second" && existing.fiveSecond));

    if (slotOk) {
      setDraft(existing);
    } else {
      const fresh = newDraft(requested);
      saveDraft(fresh);
      setDraft(fresh);
    }
  }, [typeParam, navigate]);

  // Persist draft on every change
  useEffect(() => {
    if (draft) saveDraft(draft);
  }, [draft]);

  const updateDraft = (patch: Partial<DraftStudy>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const handlePublish = async () => {
    if (!draft) return;
    // basic validation per type
    if (draft.type === "card_sort") {
      const cs = draft.cardSort!;
      if (cs.cards.length < 2) {
        toast.error("Add at least 2 cards");
        return;
      }
      if (cs.cards.some((c) => !c.label.trim())) {
        toast.error("All cards need a label");
        return;
      }
      if (cs.config.sort_type === "closed") {
        if (cs.categories.length < 2) {
          toast.error("Closed sort needs at least 2 categories");
          return;
        }
        if (cs.categories.some((c) => !c.label.trim())) {
          toast.error("All categories need a label");
          return;
        }
      }
    } else if (draft.type === "survey") {
      const sv = draft.survey!;
      if (sv.config.questions.length === 0) {
        toast.error("Add at least one question");
        return;
      }
      if (sv.config.questions.some((q) => !q.label.trim())) {
        toast.error("All questions need a label");
        return;
      }
    } else if (draft.type === "first_click") {
      const fc = draft.firstClick!;
      if (!fc.config.task.trim()) {
        toast.error("Add a task prompt");
        return;
      }
      if (!fc.config.image_url) {
        toast.error("Add an image (sign in to upload)");
        return;
      }
    } else if (draft.type === "tree_test") {
      const tt = draft.treeTest!;
      if (!tt.config.task.trim()) {
        toast.error("Add a task prompt");
        return;
      }
      if (tt.nodes.length < 2) {
        toast.error("Add at least 2 tree nodes");
        return;
      }
      if (!tt.config.correct_node_id) {
        toast.error("Pick the correct destination node");
        return;
      }
    } else if (draft.type === "five_second") {
      const fs = draft.fiveSecond!;
      if (!fs.config.image_url) {
        toast.error("Add an image (sign in to upload)");
        return;
      }
    }

    if (!user) {
      setSignInOpen(true);
      return;
    }

    // Already signed in — publish directly
    setPublishing(true);
    try {
      const studyId = await persistDraftToDb(draft, user.id);
      clearDraft();
      navigate(`/studies/${studyId}/edit`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to publish";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  if (!draft || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  const meta = STUDY_TYPE_META[draft.type];

  return (
    <>
      <AppHeader />
      <main className="p-6 max-w-3xl space-y-6">
        <button onClick={() => navigate("/")} className="underline">
          Back
        </button>

        <div className="flex items-center justify-between gap-4">
          <h1>New {meta.label.toLowerCase()}</h1>
          <span>Draft · saved in this browser</span>
        </div>

        <section className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder={`Untitled ${meta.label}`}
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              value={draft.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
              placeholder="Brief context shown to participants."
            />
          </div>
        </section>

        {draft.type === "card_sort" && (
          <CardSortFields
            draft={draft}
            onChange={(next) => setDraft(next)}
          />
        )}

        {draft.type === "survey" && (
          <SurveyFields
            draft={draft}
            onChange={(next) => setDraft(next)}
          />
        )}

        {draft.type === "first_click" && (
          <FirstClickFields
            draft={draft}
            user={user}
            onChange={(next) => setDraft(next)}
          />
        )}

        {draft.type === "tree_test" && (
          <TreeTestFields
            draft={draft}
            onChange={(next) => setDraft(next)}
          />
        )}

        {draft.type === "five_second" && (
          <FiveSecondFields
            draft={draft}
            user={user}
            onChange={(next) => setDraft(next)}
          />
        )}

        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button
            variant="outline"
            onClick={() => {
              clearDraft();
              navigate("/");
            }}
          >
            Discard
          </Button>
          <Button onClick={handlePublish} disabled={publishing}>
            {publishing
              ? "Publishing…"
              : user
                ? "Publish"
                : "Get shareable link"}
          </Button>
        </div>
      </main>

      <SignInToPublishModal open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}

// ---------- Card Sort fields ----------
function CardSortFields({
  draft,
  onChange,
}: {
  draft: DraftStudy;
  onChange: (d: DraftStudy) => void;
}) {
  const cs = draft.cardSort!;
  const set = (next: typeof cs) =>
    onChange({ ...draft, cardSort: next });

  return (
    <>
      <section className="mt-8 space-y-2">
        <Label>Sort type</Label>
        <Select
          value={cs.config.sort_type}
          onValueChange={(v) =>
            set({
              ...cs,
              config: { sort_type: v as CardSortConfig["sort_type"] },
            })
          }
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">
              Open — participants name categories
            </SelectItem>
            <SelectItem value="closed">
              Closed — you define categories
            </SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Cards
        </h2>
        <ul className="mt-4 space-y-3">
          {cs.cards.map((c, i) => (
            <li key={c.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="mt-2 text-xs text-muted-foreground">
                  {i + 1}.
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Card label"
                    value={c.label}
                    onChange={(e) =>
                      set({
                        ...cs,
                        cards: cs.cards.map((x) =>
                          x.id === c.id ? { ...x, label: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <Textarea
                    rows={2}
                    placeholder="Optional description"
                    value={c.description}
                    onChange={(e) =>
                      set({
                        ...cs,
                        cards: cs.cards.map((x) =>
                          x.id === c.id
                            ? { ...x, description: e.target.value }
                            : x,
                        ),
                      })
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    set({
                      ...cs,
                      cards: cs.cards.filter((x) => x.id !== c.id),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              set({
                ...cs,
                cards: [
                  ...cs.cards,
                  {
                    id: crypto.randomUUID(),
                    label: "",
                    description: "",
                    position: cs.cards.length,
                  },
                ],
              })
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add card
          </Button>
        </div>
      </section>

      {cs.config.sort_type === "closed" && (
        <section className="mt-12">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Categories
          </h2>
          <ul className="mt-4 space-y-2">
            {cs.categories.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2">
                <div className="w-6 text-xs text-muted-foreground">
                  {i + 1}.
                </div>
                <Input
                  placeholder="Category label"
                  value={c.label}
                  onChange={(e) =>
                    set({
                      ...cs,
                      categories: cs.categories.map((x) =>
                        x.id === c.id ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    set({
                      ...cs,
                      categories: cs.categories.filter((x) => x.id !== c.id),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                set({
                  ...cs,
                  categories: [
                    ...cs.categories,
                    {
                      id: crypto.randomUUID(),
                      label: "",
                      position: cs.categories.length,
                    },
                  ],
                })
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add category
            </Button>
          </div>
        </section>
      )}
    </>
  );
}

// ---------- Survey fields ----------
function SurveyFields({
  draft,
  onChange,
}: {
  draft: DraftStudy;
  onChange: (d: DraftStudy) => void;
}) {
  const sv = draft.survey!;
  const set = (next: typeof sv) => onChange({ ...draft, survey: next });

  const addQuestion = (type: SurveyQuestionType) => {
    set({
      ...sv,
      config: {
        ...sv.config,
        questions: [
          ...sv.config.questions,
          {
            id: crypto.randomUUID(),
            type,
            label: "",
            options:
              type === "multiple_choice"
                ? ["Option 1", "Option 2"]
                : undefined,
          },
        ],
      },
    });
  };

  const updateQuestion = (qid: string, patch: Partial<SurveyQuestion>) =>
    set({
      ...sv,
      config: {
        ...sv.config,
        questions: sv.config.questions.map((q) =>
          q.id === qid ? { ...q, ...patch } : q,
        ),
      },
    });

  const removeQuestion = (qid: string) =>
    set({
      ...sv,
      config: {
        ...sv.config,
        questions: sv.config.questions.filter((q) => q.id !== qid),
      },
    });

  return (
    <>
      <section className="mt-8 space-y-2">
        <Label>Layout</Label>
        <Select
          value={sv.config.layout ?? "single_page"}
          onValueChange={(v) =>
            set({
              ...sv,
              config: { ...sv.config, layout: v as SurveyConfig["layout"] },
            })
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single_page">All on one page</SelectItem>
            <SelectItem value="one_per_page">One per page</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Questions
        </h2>
        <ul className="mt-4 space-y-3">
          {sv.config.questions.map((q, i) => (
            <li key={q.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="mt-2 text-xs text-muted-foreground">
                  {i + 1}.
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={q.type}
                      onValueChange={(v) => {
                        const next = v as SurveyQuestionType;
                        updateQuestion(q.id, {
                          type: next,
                          options:
                            next === "multiple_choice"
                              ? q.options ?? ["Option 1", "Option 2"]
                              : undefined,
                        });
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">
                          Multiple choice
                        </SelectItem>
                        <SelectItem value="likert">Likert (1-5)</SelectItem>
                        <SelectItem value="open_text">Open text</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      onClick={() => removeQuestion(q.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Question…"
                    value={q.label}
                    onChange={(e) =>
                      updateQuestion(q.id, { label: e.target.value })
                    }
                  />
                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {(q.options ?? []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const opts = [...(q.options ?? [])];
                              opts[oi] = e.target.value;
                              updateQuestion(q.id, { options: opts });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const opts = (q.options ?? []).filter(
                                (_, i) => i !== oi,
                              );
                              updateQuestion(q.id, { options: opts });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuestion(q.id, {
                            options: [
                              ...(q.options ?? []),
                              `Option ${(q.options?.length ?? 0) + 1}`,
                            ],
                          })
                        }
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add option
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuestion("multiple_choice")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Multiple choice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuestion("likert")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Likert
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addQuestion("open_text")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Open text
          </Button>
        </div>
      </section>
    </>
  );
}

// ---------- Persistence helper (also used by Dashboard claim flow) ----------
export async function persistDraftToDb(
  draft: DraftStudy,
  researcherId: string,
): Promise<string> {
  const meta = STUDY_TYPE_META[draft.type];
  const slug = generateSlug();

  const config =
    draft.type === "card_sort"
      ? draft.cardSort?.config ?? { sort_type: "open" }
      : draft.type === "survey"
        ? draft.survey?.config ?? { questions: [], layout: "single_page" }
        : draft.type === "first_click"
          ? draft.firstClick?.config ?? { task: "", image_url: "" }
          : draft.type === "tree_test"
            ? draft.treeTest?.config ?? { task: "", correct_node_id: "" }
            : draft.type === "five_second"
              ? draft.fiveSecond?.config ?? {
                  image_url: "",
                  duration_ms: 5000,
                  follow_up: [],
                }
              : {};

  const { data: study, error: studyErr } = await supabase
    .from("studies")
    .insert({
      researcher_id: researcherId,
      title: draft.title.trim() || `Untitled ${meta.label}`,
      description: draft.description.trim() || null,
      type: draft.type,
      status: "live",
      slug,
      config: config as never,
    })
    .select("id")
    .single();
  if (studyErr || !study) {
    throw new Error(studyErr?.message ?? "Failed to create study");
  }

  if (draft.type === "card_sort" && draft.cardSort) {
    const cardRows = draft.cardSort.cards.map((c, i) => ({
      id: c.id,
      study_id: study.id,
      label: c.label.trim() || "Untitled card",
      description: c.description.trim() || null,
      position: i,
    }));
    if (cardRows.length) {
      const { error } = await supabase.from("cards").insert(cardRows);
      if (error) throw new Error(error.message);
    }
    if (draft.cardSort.config.sort_type === "closed") {
      const catRows = draft.cardSort.categories.map((c, i) => ({
        id: c.id,
        study_id: study.id,
        label: c.label.trim() || "Untitled category",
        position: i,
      }));
      if (catRows.length) {
        const { error } = await supabase.from("categories").insert(catRows);
        if (error) throw new Error(error.message);
      }
    }
  }

  if (draft.type === "tree_test" && draft.treeTest) {
    const nodeRows = draft.treeTest.nodes.map((n, i) => ({
      id: n.id,
      study_id: study.id,
      label: n.label.trim() || "Untitled node",
      parent_id: n.parent_id,
      position: i,
    }));
    if (nodeRows.length) {
      const { error } = await supabase.from("tree_nodes").insert(nodeRows);
      if (error) throw new Error(error.message);
    }
  }

  return study.id;
}

// ---------- First-click fields ----------
function FirstClickFields({
  draft,
  user,
  onChange,
}: {
  draft: DraftStudy;
  user: { id: string } | null;
  onChange: (d: DraftStudy) => void;
}) {
  const fc = draft.firstClick!;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const set = (cfg: typeof fc.config) =>
    onChange({ ...draft, firstClick: { config: cfg } });

  const handleFile = async (file: File) => {
    if (!user) {
      toast.error("Sign in to upload images");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("study-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("study-assets").getPublicUrl(path);
    set({ ...fc.config, image_url: data.publicUrl });
    setUploading(false);
  };

  return (
    <section className="mt-12 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task">Task prompt</Label>
        <Textarea
          id="task"
          rows={3}
          value={fc.config.task}
          onChange={(e) => set({ ...fc.config, task: e.target.value })}
          placeholder="e.g. Where would you click to add a new project?"
        />
      </div>
      <div>
        <Label>Image</Label>
        {fc.config.image_url ? (
          <div className="mt-2 space-y-3">
            <img
              src={fc.config.image_url}
              alt="Stimulus"
              className="max-h-[400px] w-auto rounded-lg border border-border"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => set({ ...fc.config, image_url: "" })}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : !user ? (
          <div className="mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-sm text-muted-foreground">
            <Lock className="h-6 w-6" />
            <span>Sign in to upload an image</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-sm text-muted-foreground hover:bg-muted/60"
          >
            <ImageIcon className="h-6 w-6" />
            <span>{uploading ? "Uploading…" : "Click to upload an image"}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}

// ---------- Tree test fields ----------
function TreeTestFields({
  draft,
  onChange,
}: {
  draft: DraftStudy;
  onChange: (d: DraftStudy) => void;
}) {
  const tt = draft.treeTest!;
  const setNodes = (nodes: DraftTreeNode[]) =>
    onChange({ ...draft, treeTest: { ...tt, nodes } });
  const setConfig = (cfg: typeof tt.config) =>
    onChange({ ...draft, treeTest: { ...tt, config: cfg } });

  return (
    <>
      <section className="mt-12 space-y-2">
        <Label htmlFor="tt-task">Task prompt</Label>
        <Textarea
          id="tt-task"
          rows={3}
          value={tt.config.task}
          onChange={(e) => setConfig({ ...tt.config, task: e.target.value })}
          placeholder="e.g. Where would you go to update your billing info?"
        />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Tree nodes
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use parent links to nest items. Mark one as the correct destination.
        </p>
        <ul className="mt-4 space-y-2">
          {tt.nodes.map((n, i) => (
            <li key={n.id} className="flex items-center gap-2">
              <div className="w-6 text-xs text-muted-foreground">{i + 1}.</div>
              <Input
                placeholder="Node label"
                value={n.label}
                onChange={(e) =>
                  setNodes(
                    tt.nodes.map((x) =>
                      x.id === n.id ? { ...x, label: e.target.value } : x,
                    ),
                  )
                }
              />
              <Select
                value={n.parent_id ?? "__root__"}
                onValueChange={(v) =>
                  setNodes(
                    tt.nodes.map((x) =>
                      x.id === n.id
                        ? { ...x, parent_id: v === "__root__" ? null : v }
                        : x,
                    ),
                  )
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">— root —</SelectItem>
                  {tt.nodes
                    .filter((x) => x.id !== n.id)
                    .map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.label || "(untitled)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                variant={tt.config.correct_node_id === n.id ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setConfig({
                    ...tt.config,
                    correct_node_id:
                      tt.config.correct_node_id === n.id ? "" : n.id,
                  })
                }
              >
                {tt.config.correct_node_id === n.id ? "Correct ✓" : "Mark correct"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNodes(tt.nodes.filter((x) => x.id !== n.id));
                  if (tt.config.correct_node_id === n.id) {
                    setConfig({ ...tt.config, correct_node_id: "" });
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setNodes([
                ...tt.nodes,
                {
                  id: crypto.randomUUID(),
                  label: "",
                  parent_id: null,
                  position: tt.nodes.length,
                },
              ])
            }
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add node
          </Button>
        </div>
      </section>
    </>
  );
}

// ---------- Five-second fields ----------
function FiveSecondFields({
  draft,
  user,
  onChange,
}: {
  draft: DraftStudy;
  user: { id: string } | null;
  onChange: (d: DraftStudy) => void;
}) {
  const fs = draft.fiveSecond!;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const set = (cfg: typeof fs.config) =>
    onChange({ ...draft, fiveSecond: { config: cfg } });

  const handleFile = async (file: File) => {
    if (!user) {
      toast.error("Sign in to upload images");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("study-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("study-assets").getPublicUrl(path);
    set({ ...fs.config, image_url: data.publicUrl });
    setUploading(false);
  };

  return (
    <section className="mt-12 space-y-4">
      <div className="space-y-2">
        <Label>Display duration</Label>
        <Select
          value={String(fs.config.duration_ms)}
          onValueChange={(v) => set({ ...fs.config, duration_ms: Number(v) })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3000">3 seconds</SelectItem>
            <SelectItem value="5000">5 seconds</SelectItem>
            <SelectItem value="10000">10 seconds</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Image</Label>
        {fs.config.image_url ? (
          <div className="mt-2 space-y-3">
            <img
              src={fs.config.image_url}
              alt="Stimulus"
              className="max-h-[400px] w-auto rounded-lg border border-border"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" /> Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => set({ ...fs.config, image_url: "" })}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : !user ? (
          <div className="mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-sm text-muted-foreground">
            <Lock className="h-6 w-6" />
            <span>Sign in to upload an image</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-sm text-muted-foreground hover:bg-muted/60"
          >
            <ImageIcon className="h-6 w-6" />
            <span>{uploading ? "Uploading…" : "Click to upload an image"}</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </section>
  );
}
