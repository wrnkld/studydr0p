import { Link } from "react-router-dom";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";

const TYPES: StudyType[] = [
  "card_sort",
  "survey",
  "first_click",
  "tree_test",
  "five_second",
];

interface Props {
  /**
   * How to resolve each tile's destination.
   * - "to" mode: render a Link to a path
   * - "onSelect" mode: render a button that calls back with the type
   */
  hrefFor?: (type: StudyType) => string;
  onSelect?: (type: StudyType) => void;
  disabled?: boolean;
}

// Single source of truth for the row of 5 study-type cards.
// Used on Landing, Dashboard empty state, and the New Study picker.
export default function StudyTypePicker({ hrefFor, onSelect, disabled }: Props) {
  return (
    <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
      {TYPES.map((t, index) => {
        const meta = STUDY_TYPE_META[t];
        const num = String(index + 1).padStart(2, "0");
        const className =
          "group flex aspect-square w-full flex-col justify-between rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:bg-accent/40 disabled:opacity-60";
        return (
          <li key={t}>
            {hrefFor ? (
              <Link to={hrefFor(t)} className={className}>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {num}
                </span>
                <span className="text-base font-medium leading-tight">
                  {meta.label}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => onSelect?.(t)}
                disabled={disabled}
                className={className}
              >
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {num}
                </span>
                <span className="text-base font-medium leading-tight">
                  {meta.label}
                </span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
