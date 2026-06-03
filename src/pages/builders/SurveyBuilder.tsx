import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";
import {
  SurveyConfig,
  SurveyQuestion,
  SurveyQuestionType,
  StudyStatus,
  LikertPreset,
  LIKERT_PRESETS,
} from "@/lib/types";
import { Trash2, Plus, GripVertical } from "lucide-react";
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

interface Props {
  studyId: string;
  onMetaChange?: (meta: { title: string; description: string }) => void;
  initial: {
    title: string;
    description: string | null;
    status: StudyStatus;
    slug: string | null;
    config: SurveyConfig;
  };
}

export default function SurveyBuilder({ studyId, initial, onMetaChange }: Props) {
  const navigate = useNavigate();
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
  const [config, setConfig] = useState<SurveyConfig>({
    questions: initial.config.questions ?? [],
    layout: "one_per_page",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addQuestion = (type: SurveyQuestionType) => {
    setConfig((c) => ({
      ...c,
      questions: [
        ...c.questions,
        {
          id: crypto.randomUUID(),
          type,
          label: "",
          options: type === "multiple_choice" ? ["Option 1", "Option 2"] : undefined,
        },
      ],
    }));
  };

  const updateQuestion = (qid: string, patch: Partial<SurveyQuestion>) => {
    setConfig((c) => ({
      ...c,
      questions: c.questions.map((q) => (q.id === qid ? { ...q, ...patch } : q)),
    }));
  };

  const removeQuestion = (qid: string) => {
    setConfig((c) => ({ ...c, questions: c.questions.filter((q) => q.id !== qid) }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setConfig((c) => {
      const oldIndex = c.questions.findIndex((q) => q.id === active.id);
      const newIndex = c.questions.findIndex((q) => q.id === over.id);
      return { ...c, questions: arrayMove(c.questions, oldIndex, newIndex) };
    });
  };

  const save = async (
    overrides: Partial<{ status: StudyStatus; slug: string | null }> = {},
  ) => {
    setSaving(true);
    try {
      // Confirm the study still exists (and is owned by us under RLS) before
      // attempting an update — silent 0-row updates are confusing.
      const { data: existing, error: checkErr } = await supabase
        .from("studies")
        .select("id")
        .eq("id", studyId)
        .maybeSingle();
      if (checkErr) {
        console.error("[SurveyBuilder] study lookup failed", checkErr);
        throw new Error(checkErr.message);
      }
      if (!existing) {
        toast.error("This study no longer exists. Redirecting…");
        navigate("/");
        return null;
      }

      const payload = {
        title: title.trim() || "Untitled study",
        description: description.trim() || null,
        config: { ...config, layout: "one_per_page" } as unknown as never,
        status: overrides.status ?? status,
        slug: overrides.slug !== undefined ? overrides.slug : slug,
      };
      const { error } = await supabase.from("studies").update(payload).eq("id", studyId);
      if (error) {
        console.error("[SurveyBuilder] study update failed", error);
        throw new Error(`Couldn't save survey: ${error.message}`);
      }
      return payload;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong while saving";
      toast.error(msg);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (config.questions.length === 0) {
      toast.error("Add at least one question first");
      return false;
    }
    if (config.questions.some((q) => !q.label.trim())) {
      toast.error("All questions need a label");
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

  useRegisterStudyActions({
    studyId,
    onSave: handleSave,
    onDelete: handleDelete,
    saving,
  });

  const shareUrl = slug ? `${window.location.origin}/s/${slug}` : null;

  return (
    <div className="space-y-8">

      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief context shown to participants."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2>Questions</h2>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={config.questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-3">
              {config.questions.map((q, i) => (
                <SortableQuestionRow
                  key={q.id}
                  question={q}
                  index={i}
                  updateQuestion={updateQuestion}
                  removeQuestion={removeQuestion}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => addQuestion("multiple_choice")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Multiple choice
          </Button>
          <Button variant="outline" size="sm" onClick={() => addQuestion("likert")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Rating scale
          </Button>
          <Button variant="outline" size="sm" onClick={() => addQuestion("open_text")}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Open text
          </Button>
        </div>
      </section>

    </div>
  );
}

function SortableQuestionRow({
  question: q,
  index: i,
  updateQuestion,
  removeQuestion,
}: {
  question: SurveyQuestion;
  index: number;
  updateQuestion: (qid: string, patch: Partial<SurveyQuestion>) => void;
  removeQuestion: (qid: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className="group rounded-md border p-4 bg-background">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground touch-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="mt-2 text-sm text-muted-foreground">{i + 1}.</div>
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
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                <SelectItem value="likert">Rating scale (1-5)</SelectItem>
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
            onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
          />
          {q.type === "multiple_choice" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${q.id}-multi`}
                  checked={!!q.multi}
                  onCheckedChange={(checked) => updateQuestion(q.id, { multi: checked === true })}
                />
                <Label htmlFor={`${q.id}-multi`} className="text-sm font-normal text-muted-foreground">
                Allow multiple selections
                </Label>
              </div>
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
                        (_, idx) => idx !== oi,
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
  );
}
