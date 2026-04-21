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

const VALID_TYPES: StudyType[] = [
  "card_sort",
  "survey",
  "first_click",
  "tree_test",
  "five_second",
];

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

    // Types without a local-draft builder route straight into the
    // full authenticated builder (auto-creates the study on arrival).
    if (!SUPPORTED.includes(requested)) {
      navigate(`/dashboard/studies/new?type=${requested}`, { replace: true });
      return;
    }

    if (existing && existing.type === requested) {
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
    } else {
      toast.info(`${STUDY_TYPE_META[draft.type].label} isn't ready to publish yet.`);
      return;
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
      navigate(`/dashboard/studies/${studyId}/edit`);
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
  const supported = SUPPORTED.includes(draft.type);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-10">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
        </button>

        <div className="mt-6 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            New {meta.label.toLowerCase()}
          </h1>
          <span className="text-xs text-muted-foreground">
            Draft · saved in this browser
          </span>
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

        {!supported && (
          <div className="mt-10 rounded-lg border border-dashed border-border p-8 text-center">
            <div className="font-medium">
              {meta.label} builder is coming soon
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              We're still building this study type. Try{" "}
              <button
                className="underline"
                onClick={() => {
                  clearDraft();
                  navigate("/build/card_sort", { replace: true });
                }}
              >
                Card sort
              </button>{" "}
              or{" "}
              <button
                className="underline"
                onClick={() => {
                  clearDraft();
                  navigate("/build/survey", { replace: true });
                }}
              >
                Survey
              </button>{" "}
              instead.
            </p>
          </div>
        )}

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
          <Button onClick={handlePublish} disabled={publishing || !supported}>
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

  return study.id;
}
