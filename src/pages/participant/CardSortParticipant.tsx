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
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const cardById = (id: string) => cards.find((c) => c.id === id);

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-5xl py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{study.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {study.config.sort_type === "open"
            ? "Group the cards into categories that make sense to you, then name each group."
            : "Drag each card into the category where you think it belongs."}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Unsorted column */}
          <DropZone
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
            {unsorted.length === 0 && (
              <div className="text-xs text-muted-foreground">All sorted ✓</div>
            )}
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
          </DropZone>

          {/* Categories area */}
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {groups.map((g) => (
                <DropZone
                  key={g.id}
                  id={g.id}
                  label={
                    study.config.sort_type === "closed" ? (
                      <span className="text-sm font-medium">{g.label}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          value={g.label}
                          onChange={(e) => renameGroup(g.id, e.target.value)}
                          placeholder="Category name"
                          className="h-8"
                        />
                        <button
                          type="button"
                          onClick={() => removeOpenGroup(g.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  }
                  isDragOver={dragOver === g.id}
                  onDragEnter={() => setDragOver(g.id)}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => {
                    if (draggedCardId) moveCardTo(draggedCardId, g.id);
                    setDragOver(null);
                    setDraggedCardId(null);
                  }}
                >
                  {g.card_ids.length === 0 && (
                    <div className="text-xs text-muted-foreground">Drop cards here</div>
                  )}
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
                </DropZone>
              ))}
            </div>

            {study.config.sort_type === "open" && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOpenCategory}
                className="mt-4"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add category
              </Button>
            )}
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            {unsorted.length > 0
              ? `${unsorted.length} card${unsorted.length === 1 ? "" : "s"} left to sort.`
              : "All cards sorted."}
          </p>
        </div>
      </main>
    </div>
  );
}

function DropZone({
  id,
  label,
  children,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: {
  id: string;
  label: React.ReactNode;
  children: React.ReactNode;
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
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
      className={`rounded-lg border p-3 transition-colors ${
        isDragOver
          ? "border-foreground bg-accent/40"
          : "border-border bg-background"
      }`}
      data-zone-id={id}
    >
      <div className="mb-2 px-1">{label}</div>
      <div className="min-h-[80px] space-y-2">{children}</div>
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

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group relative cursor-grab rounded-md border border-border bg-card p-3 text-sm shadow-sm active:cursor-grabbing"
    >
      <div className="font-medium">{card.label}</div>
      {card.description && (
        <div className="mt-1 text-xs text-muted-foreground">{card.description}</div>
      )}
      {/* Mobile fallback: tap to move */}
      <button
        type="button"
        onClick={() => setShowMenu((s) => !s)}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-accent sm:hidden"
        aria-label="Move card"
      >
        ⋯
      </button>
      {showMenu && (
        <div className="absolute right-2 top-9 z-10 w-44 rounded-md border border-border bg-popover p-1 shadow-md sm:hidden">
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
