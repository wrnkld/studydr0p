import {
  LayoutGrid,
  ListChecks,
  GitBranch,
  MousePointerClick,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { StudyType } from "@/lib/types";
import { createElement } from "react";
import { cn } from "@/lib/utils";

export const STUDY_TYPE_ICONS: Record<StudyType, LucideIcon> = {
  card_sort: LayoutGrid,
  survey: ListChecks,
  first_click: MousePointerClick,
  five_second: Timer,
  tree_test: GitBranch,
};

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
    size,
    className: cn("text-muted-foreground", className),
  });
}
