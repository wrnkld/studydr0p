import {
  SquaresFour,
  ListChecks,
  TreeStructure,
  CursorClick,
  Timer,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { StudyType } from "@/lib/types";
import { createElement } from "react";
import { cn } from "@/lib/utils";

export const STUDY_TYPE_ICONS: Record<StudyType, PhosphorIcon> = {
  card_sort: SquaresFour,
  survey: ListChecks,
  first_click: CursorClick,
  five_second: Timer,
  tree_test: TreeStructure,
};

/**
 * Phosphor duotone icon for a study type.
 * Primary layer #1C1A17, secondary duotone layer #D95F3B at 30% opacity
 * (applied via the `.study-type-icon` CSS rule in index.css).
 */
export function StudyTypeIcon({
  type,
  size = 24,
  className,
}: {
  type: StudyType;
  size?: number;
  className?: string;
}) {
  const Icon = STUDY_TYPE_ICONS[type];
  if (!Icon) return null;
  return createElement(Icon, {
    weight: "duotone",
    size,
    color: "#1C1A17",
    className: cn("study-type-icon", className),
  });
}
