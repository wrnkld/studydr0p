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
import { Chip, Frame, Kicker, SectionHeader } from "@/components/study/primitives";

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
        <SectionHeader
          kicker="Card sort"
          title="Sort each item into the part of the fridge it belongs in."
        />

        <DropZone id={POOL} label={`Cards · ${remaining} left`}>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {cardsIn(POOL).map((c) => (
              <DraggableCard key={c} id={c} label={c} />
            ))}
          </div>
        </DropZone>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <DropZone key={cat} id={cat} label={cat}>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {cardsIn(cat).map((c) => (
                  <DraggableCard key={c} id={c} label={c} />
                ))}
              </div>
            </DropZone>
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

function DropZone({
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
    <Frame ref={setNodeRef} active={isOver}>
      <Kicker className="mb-2">{label}</Kicker>
      {children}
    </Frame>
  );
}
