import { useEffect, useState } from "react";
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
  onDone,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [unsorted, setUnsorted] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
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
      // shuffle for unbiased order
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
  }, [study.id, study.config.sort_type]);

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
    if (preview) {
      // Don't pollute real data with preview submissions.
      setSubmitting(false);
      onDone();
      return;
    }
    const data: CardSortResponseData = {
      sort_type: study.config.sort_type,
      groups: groups.map((g) => ({
        category_id: g.source_category_id,
        category_label: g.label.trim(),
        card_ids: g.card_ids,
      })),
      unsorted_card_ids: unsorted,
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const cardById = (id: string) => cards.find((c) => c.id === id);

  return (
    <div className="space-y-6">
      {/* Pool of unsorted cards */}
      <PoolZone
        id={UNSORTED}
        label={`Cards (${unsorted.length})`}
        isDragOver={dragOver === UNSORTED}
        onDragEnter={() => setDragOver(UNSORTED)}
        onDragLeave={() => setDragOver(null)}
        onDrop={() => {
          if (draggedCardId) moveCardTo(draggedCardId, UNSORTED);
          setDragOver(null);
          setDraggedCardId(null);
        }}
      >
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {unsorted.map((id) => {
            const c = cardById(id);
            if (!c) return null;
            return (
              <DraggableCard
                key={id}
                card={c}
                onDragStart={() => setDraggedCardId(id)}
                onDragEnd={() => setDraggedCardId(null)}
                onMobileMove={(targetId) => moveCardTo(id, targetId)}
                groups={groups}
                showUnsortedOption={false}
              />
            );
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
              isDragOver={dragOver === g.id}
              onRename={(label) => renameGroup(g.id, label)}
              onRemove={() => removeOpenGroup(g.id)}
              onDragEnter={() => setDragOver(g.id)}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => {
                if (draggedCardId) moveCardTo(draggedCardId, g.id);
                setDragOver(null);
                setDraggedCardId(null);
              }}
            >
              {g.card_ids.map((id) => {
                const c = cardById(id);
                if (!c) return null;
                return (
                  <DraggableCard
                    key={id}
                    card={c}
                    onDragStart={() => setDraggedCardId(id)}
                    onDragEnd={() => setDraggedCardId(null)}
                    onMobileMove={(targetId) => moveCardTo(id, targetId)}
                    groups={groups}
                    showUnsortedOption
                  />
                );
              })}
            </CategoryZone>
          ))}
        </div>

        {study.config.sort_type === "open" && (
          <Button variant="outline" size="sm" onClick={addOpenCategory}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add category
          </Button>
        )}
      </div>

      <div className="space-y-2 border-t border-foreground pt-6">
        <Button onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {unsorted.length > 0
            ? `${unsorted.length} card${unsorted.length === 1 ? "" : "s"} left to sort.`
            : "All cards sorted."}
        </p>
      </div>
    </div>
  );
}

/** Top pool — Frame with header showing count. */
function PoolZone({
  id,
  label,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  children,
}: {
  id: string;
  label: string;
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      data-zone-id={id}
    >
      <Frame active={isDragOver}>
        <Kicker className="mb-2">{label}</Kicker>
        {children}
      </Frame>
    </div>
  );
}

/** Category drop zone — dashed when empty, solid card when filled or hovered. */
function CategoryZone({
  id,
  label,
  isOpenSort,
  isDragOver,
  onRename,
  onRemove,
  onDragEnter,
  onDragLeave,
  onDrop,
  children,
}: {
  id: string;
  label: string;
  isOpenSort: boolean;
  isDragOver: boolean;
  onRename: (v: string) => void;
  onRemove: () => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  children: React.ReactNode;
}) {
  const hasCards = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : Boolean(children);
  const showSolid = isDragOver || hasCards;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      data-zone-id={id}
      className={cn(
        "rounded-lg p-3 transition-colors min-h-[88px] flex",
        !showSolid && "border border-dashed border-foreground/40",
        showSolid && "border border-foreground bg-card",
        isDragOver && "bg-muted/70",
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
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Kicker>{label}</Kicker>
        )}
        {hasCards ? (
          <div className="flex flex-wrap gap-2">{children}</div>
        ) : (
          <div className="flex flex-1 items-center justify-center py-3">
            <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 font-medium">
              Drop cards here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({
  card,
  onDragStart,
  onDragEnd,
  onMobileMove,
  groups,
  showUnsortedOption,
}: {
  card: CardRow;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMobileMove: (targetId: string) => void;
  groups: Group[];
  showUnsortedOption: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="relative inline-block">
      <Chip
        draggable
        onDragStart={() => {
          setIsDragging(true);
          onDragStart();
        }}
        onDragEnd={() => {
          setIsDragging(false);
          onDragEnd();
        }}
        style={{ opacity: isDragging ? 0.6 : 1 }}
      >
        {card.label}
      </Chip>
      <button
        type="button"
        onClick={() => setShowMenu((s) => !s)}
        className="absolute -right-1 -top-1 rounded p-1 text-muted-foreground hover:bg-accent sm:hidden"
        aria-label="Move card"
      >
        ⋯
      </button>
      {showMenu && (
        <div className="absolute right-0 top-8 z-10 w-44 rounded-md border border-foreground bg-popover p-1 shadow-md sm:hidden">
          {showUnsortedOption && (
            <button
              type="button"
              onClick={() => {
                onMobileMove(UNSORTED);
                setShowMenu(false);
              }}
              className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
            >
              ← Move to unsorted
            </button>
          )}
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                onMobileMove(g.id);
                setShowMenu(false);
              }}
              className="block w-full truncate rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
            >
              → {g.label || "Untitled"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
