import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  CardRow,
  CardSortConfig,
  CardSortResponseData,
  CategoryRow,
} from "@/lib/types";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Chip, Frame, Kicker } from "@/components/study/primitives";
import { cn } from "@/lib/utils";

interface Props {
  study: {
    id: string;
    title: string;
    description: string | null;
    config: CardSortConfig;
  };
  sessionId: string;
  startedAt: number;
  /** When true, skip writing responses/sessions to the database. */
  preview?: boolean;
  /**
   * In-memory mode: skip Supabase entirely. Caller passes cards (and
   * categories for closed sort) and receives the response via
   * `onSubmitInMemory`. Used by canned example studies.
   */
  inMemory?: boolean;
  initialCards?: CardRow[];
  initialCategories?: CategoryRow[];
  onSubmitInMemory?: (data: CardSortResponseData) => void;
  onDone: () => void;
}

interface Group {
  id: string;
  label: string;
  card_ids: string[];
  // null for participant-created in open sort
  source_category_id: string | null;
}

const UNSORTED = "__unsorted__";

export default function CardSortParticipant({
  study,
  sessionId,
  startedAt,
  preview = false,
  inMemory = false,
  initialCards,
  initialCategories,
  onSubmitInMemory,
  onDone,
}: Props) {
  const [loading, setLoading] = useState(!inMemory);
  const [cards, setCards] = useState<CardRow[]>(() => {
    if (!inMemory || !initialCards) return [];
    return [...initialCards].sort(() => Math.random() - 0.5);
  });
  const [groups, setGroups] = useState<Group[]>(() => {
    if (!inMemory) return [];
    if (study.config.sort_type === "closed" && initialCategories) {
      return initialCategories.map((c) => ({
        id: c.id,
        label: c.label,
        card_ids: [],
        source_category_id: c.id,
      }));
    }
    return [];
  });
  const [unsorted, setUnsorted] = useState<string[]>(() => {
    if (!inMemory || !initialCards) return [];
    return [...initialCards].sort(() => Math.random() - 0.5).map((c) => c.id);
  });
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  useEffect(() => {
    if (inMemory) return;
    (async () => {
      const [cardsRes, catsRes] = await Promise.all([
        supabase
          .from("cards")
          .select("id, label, description, position")
          .eq("study_id", study.id)
          .order("position"),
        supabase
          .from("categories")
          .select("id, label, position")
          .eq("study_id", study.id)
          .order("position"),
      ]);
      const loadedCards = (cardsRes.data ?? []) as CardRow[];
      const shuffled = [...loadedCards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setUnsorted(shuffled.map((c) => c.id));

      if (study.config.sort_type === "closed") {
        const cats = (catsRes.data ?? []) as CategoryRow[];
        setGroups(
          cats.map((c) => ({
            id: c.id,
            label: c.label,
            card_ids: [],
            source_category_id: c.id,
          })),
        );
      } else {
        setGroups([]);
      }
      setLoading(false);
    })();
  }, [study.id, study.config.sort_type, inMemory]);

  const moveCardTo = (cardId: string, targetGroupId: string) => {
    if (targetGroupId === UNSORTED) {
      setGroups((gs) =>
        gs.map((g) => ({ ...g, card_ids: g.card_ids.filter((id) => id !== cardId) })),
      );
      setUnsorted((u) => (u.includes(cardId) ? u : [...u, cardId]));
      return;
    }
    setUnsorted((u) => u.filter((id) => id !== cardId));
    setGroups((gs) =>
      gs.map((g) => {
        if (g.id === targetGroupId) {
          if (g.card_ids.includes(cardId)) return g;
          return { ...g, card_ids: [...g.card_ids, cardId] };
        }
        return { ...g, card_ids: g.card_ids.filter((id) => id !== cardId) };
      }),
    );
  };

  const onDragEnd = (e: DragEndEvent) => {
    const cardId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    moveCardTo(cardId, overId);
  };

  const addOpenCategory = () => {
    setGroups((gs) => [
      ...gs,
      {
        id: crypto.randomUUID(),
        label: "",
        card_ids: [],
        source_category_id: null,
      },
    ]);
  };

  const renameGroup = (groupId: string, label: string) => {
    setGroups((gs) => gs.map((g) => (g.id === groupId ? { ...g, label } : g)));
  };

  const removeOpenGroup = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId);
    if (!g) return;
    setUnsorted((u) => [...u, ...g.card_ids]);
    setGroups((gs) => gs.filter((x) => x.id !== groupId));
  };

  const submit = async () => {
    if (unsorted.length > 0) {
      toast.error("Please sort all cards first");
      return;
    }
    if (study.config.sort_type === "open") {
      if (groups.length === 0) {
        toast.error("Create at least one category");
        return;
      }
      if (groups.some((g) => !g.label.trim())) {
        toast.error("All categories need a name");
        return;
      }
    }
    setSubmitting(true);
    const data: CardSortResponseData = {
      sort_type: study.config.sort_type,
      groups: groups.map((g) => ({
        category_id: g.source_category_id,
        category_label: g.label.trim(),
        card_ids: g.card_ids,
      })),
      unsorted_card_ids: unsorted,
    };
    if (inMemory) {
      onSubmitInMemory?.(data);
      setSubmitting(false);
      onDone();
      return;
    }
    // Preview mode: still persist the response so it shows in results
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
    if (preview) {
      onDone();
      return;
    }
    toast.success("Thanks! Your response was recorded.");
    onDone();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const cardById = (id: string) => cards.find((c) => c.id === id);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-6">
        {/* Pool of unsorted cards */}
        <PoolZone id={UNSORTED} label={`Cards (${unsorted.length})`}>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {unsorted.map((id) => {
              const c = cardById(id);
              if (!c) return null;
              return <DraggableCard key={id} id={id} label={c.label} />;
            })}
          </div>
        </PoolZone>

        {/* Categories */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {groups.map((g) => (
              <CategoryZone
                key={g.id}
                id={g.id}
                label={g.label}
                isOpenSort={study.config.sort_type === "open"}
                cardCount={g.card_ids.length}
                onRename={(label) => renameGroup(g.id, label)}
                onRemove={() => removeOpenGroup(g.id)}
              >
                {g.card_ids.map((id) => {
                  const c = cardById(id);
                  if (!c) return null;
                  return <DraggableCard key={id} id={id} label={c.label} />;
                })}
              </CategoryZone>
            ))}
          </div>

          {study.config.sort_type === "open" && (
            <Button variant="outline" size="sm" onClick={addOpenCategory}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />Add category
            </Button>
          )}
        </div>

        <div>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </div>
    </DndContext>
  );
}

function DraggableCard({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });
  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    touchAction: "none",
  };
  return (
    <Chip
      ref={setNodeRef}
      style={style}
      draggable
      {...listeners}
      {...attributes}
    >
      {label}
    </Chip>
  );
}

function PoolZone({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="space-y-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn("transition-colors rounded-lg -mx-2 px-2 py-1", isOver && "bg-muted/50")}>
        {children}
      </div>
    </div>
  );
}

function CategoryZone({
  id,
  label,
  isOpenSort,
  cardCount,
  onRename,
  onRemove,
  children,
}: {
  id: string;
  label: string;
  isOpenSort: boolean;
  cardCount: number;
  onRename: (v: string) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isEmpty = cardCount === 0;
  const showSolid = isOver || !isEmpty;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg p-3 transition-colors min-h-[88px] flex",
        !showSolid && "border border-dashed border-foreground/20",
        showSolid && "border border-foreground bg-card",
        isOver && "bg-muted/70",
      )}
    >
      <div className="flex w-full flex-col gap-2">
        {isOpenSort ? (
          <div className="flex items-center gap-2">
            <Input
              value={label}
              onChange={(e) => onRename(e.target.value)}
              placeholder="Category name"
              className="h-7 text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        ) : (
          <Kicker>{label}</Kicker>
        )}
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center py-3">
            <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 font-medium">
              Drop cards here
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">{children}</div>
        )}
      </div>
    </div>
  );
}
