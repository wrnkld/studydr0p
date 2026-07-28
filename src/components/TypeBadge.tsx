import { StudyType, STUDY_TYPE_META } from "@/lib/types";

const ACCENT_CLASS: Record<StudyType, string> = {
  card_sort: "bg-chart-4",
  survey: "bg-chart-3",
  tree_test: "bg-chart-6",
  first_click: "bg-chart-5",
};

interface TypeBadgeProps {
  type: StudyType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const label = STUDY_TYPE_META[type]?.label ?? type;
  const accent = ACCENT_CLASS[type];
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-2.5 py-1 font-mono uppercase text-foreground"
      style={{ fontSize: "11px", letterSpacing: "0.08em" }}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${accent}`} aria-hidden />
      {label}
    </span>
  );
}
