// Participant-style card sort for the fridge example.
// All 12 cards must be placed before Submit enables.
// Calls onSubmit when the participant finishes — no data is saved.

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Chip, Frame, Kicker } from "@/components/study/primitives";
import { cn } from "@/lib/utils";

const CARDS = [
  "Ketchup",
  "Mayo",
  "Leftover pizza",
  "Beer",
  "Oat milk",
  "Mystery tupperware",
  "Wilting spinach",
  "Cheese",
  "Hot sauce",
  "Birthday cake",
  "Baking soda",
  "Eggs",
];

const CATEGORIES = [
  "Door",
  "Top shelf",
  "Middle shelf",
  "Bottom shelf",
  "Freezer",
  "Trash",
];

const POOL = "__pool__";

type Placement = Record<string, string>;

function initial(): Placement {
  const p: Placement = {};
  for (const c of CARDS) p[c] = POOL;
  return p;
}

export default function FridgeCardSortDemo({
  onSubmit,
}: {
  onSubmit: (placement: Placement) => void;
}) {
  const [placement, setPlacement] = useState<Placement>(initial);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const cardId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    setPlacement((p) => ({ ...p, [cardId]: overId }));
  };

  const cardsIn = (zone: string) =>
    CARDS.filter((c) => placement[c] === zone);

  const remaining = cardsIn(POOL).length;
  const allPlaced = remaining === 0;

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="space-y-6">

        <PoolZone id={POOL} remaining={remaining}>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {cardsIn(POOL).map((c) => (
              <DraggableCard key={c} id={c} label={c} />
            ))}
          </div>
        </PoolZone>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryZone key={cat} id={cat} label={cat} cards={cardsIn(cat)} />
          ))}
        </div>

        <Button onClick={() => onSubmit(placement)} disabled={!allPlaced}>
          Submit
        </Button>
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

/** Top pool — keeps the Frame look, shows remaining count. */
function PoolZone({
  id,
  remaining,
  children,
}: {
  id: string;
  remaining: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Frame ref={setNodeRef} active={isOver}>
      <Kicker className="mb-2">
        Cards <span className="text-muted-foreground/60">({remaining})</span>
      </Kicker>
      {children}
    </Frame>
  );
}

/** Category drop zone — dashed when empty, solid on drag-over or when filled. */
function CategoryZone({
  id,
  label,
  cards,
}: {
  id: string;
  label: string;
  cards: string[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isEmpty = cards.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg p-3 transition-colors min-h-[88px] flex",
        // Dashed when empty + idle. Solid otherwise (drag-over OR has cards).
        isEmpty && !isOver && "border border-dashed border-[hsl(var(--border))]",
        (isOver || !isEmpty) && "border border-border bg-card",
        isOver && "bg-muted/70",
      )}
    >
      {isEmpty ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70 font-medium">
            {label}
          </span>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-2">
          <Kicker>{label}</Kicker>
          <div className="flex flex-wrap gap-2">
            {cards.map((c) => (
              <DraggableCard key={c} id={c} label={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
