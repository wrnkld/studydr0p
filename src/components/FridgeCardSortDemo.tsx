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
  onSubmit: () => void;
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
      <div className="bg-white text-black space-y-6">
        <p className="text-base">
          Sort each item into the part of the fridge it belongs in.
        </p>

        <DropZone id={POOL} label={`Cards (${remaining} left)`}>
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

        <div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allPlaced}
            className="border border-black bg-black text-white px-6 py-2 text-sm disabled:bg-white disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Submit
          </button>
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
  };
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="border border-black bg-white px-3 py-1.5 text-sm cursor-grab active:cursor-grabbing select-none"
    >
      {label}
    </button>
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
    <div
      ref={setNodeRef}
      className="border border-black p-3"
      style={{ backgroundColor: isOver ? "hsl(0 0% 95%)" : "transparent" }}
    >
      <div className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}
