import {
  LayoutGrid,
  ListChecks,
  Network,
  MousePointerClick,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { StudyType } from "@/lib/types";
import { createElement, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export const STUDY_TYPE_ICONS: Record<StudyType, LucideIcon> = {
  card_sort: LayoutGrid,
  survey: ListChecks,
  first_click: MousePointerClick,
  tree_test: Network,
};

export function StudyTypeIcon({
  type,
  size = 24,
  strokeWidth,
  className,
  style,
}: {
  type: StudyType;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = STUDY_TYPE_ICONS[type];
  if (!Icon) return null;
  return createElement(Icon, {
    size,
    strokeWidth,
    className: cn(className),
    style,
  });
}
