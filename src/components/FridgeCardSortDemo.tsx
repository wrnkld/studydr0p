// Interactive (demo-only) card sort for the fridge example.
// Drag cards into categories. State is local; nothing is saved.

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

type Placement = Record<string, string>; // cardId -> categoryId (or POOL)

function initial(): Placement {
  const p: Placement = {};
  for (const c of CARDS) p[c] = POOL;
  return p;
}

export default function FridgeCardSortDemo() {
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

  const reset = () => setPlacement(initial());

  const cardsIn = (zone: string) =>
    CARDS.filter((c) => placement[c] === zone);

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="bg-white text-black space-y-6">
        <DropZone id={POOL} label="Cards">
          <div className="flex flex-wrap gap-2">
            {cardsIn(POOL).map((c) => (
              <DraggableCard key={c} id={c} label={c} />
            ))}
            {cardsIn(POOL).length === 0 && (
              <span className="text-xs text-gray-500">All cards placed.</span>
            )}
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
            onClick={reset}
            className="text-xs text-gray-500 underline hover:text-black"
          >
            Reset
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
