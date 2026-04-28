import { LayoutGrid, ListChecks, MousePointerClick, Timer, Network, type LucideIcon } from "lucide-react";
import { StudyType } from "@/lib/types";

export const STUDY_TYPE_ICONS: Record<StudyType, LucideIcon> = {
  card_sort: LayoutGrid,
  survey: ListChecks,
  first_click: MousePointerClick,
  five_second: Timer,
  tree_test: Network,
};
