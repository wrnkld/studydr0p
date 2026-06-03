// Shared app types — study configs

export type StudyType =
  | "card_sort"
  | "survey"
  | "first_click"
  | "tree_test";

export type StudyStatus = "draft" | "live" | "closed";

// Survey config
export type SurveyQuestionType = "multiple_choice" | "likert" | "open_text";

export type LikertPreset =
  | "agreement"
  | "satisfaction"
  | "likelihood"
  | "difficulty"
  | "frequency"
  | "custom";

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  label: string;
  options?: string[]; // for multiple_choice
  multi?: boolean; // for multiple_choice: allow selecting multiple options
  // for likert: endpoint labels for the 1–5 scale
  scale_preset?: LikertPreset;
  scale_left?: string;
  scale_right?: string;
}

export const LIKERT_PRESETS: Record<Exclude<LikertPreset, "custom">, { label: string; left: string; right: string }> = {
  agreement: { label: "Agreement", left: "Strongly disagree", right: "Strongly agree" },
  satisfaction: { label: "Satisfaction", left: "Very unsatisfied", right: "Very satisfied" },
  likelihood: { label: "Likelihood", left: "Very unlikely", right: "Very likely" },
  difficulty: { label: "Difficulty", left: "Very difficult", right: "Very easy" },
  frequency: { label: "Frequency", left: "Never", right: "Always" },
};

export function getLikertLabels(q: SurveyQuestion): { left: string; right: string } {
  const preset = q.scale_preset ?? "agreement";
  if (preset === "custom") {
    return {
      left: q.scale_left ?? "",
      right: q.scale_right ?? "",
    };
  }
  return LIKERT_PRESETS[preset];
}

export interface SurveyConfig {
  questions: SurveyQuestion[];
  layout?: "one_per_page" | "single_page";
}

export interface CardSortConfig {
  sort_type: "open" | "closed";
}

export interface CardRow {
  id: string;
  label: string;
  description: string | null;
  position: number;
}

export interface CategoryRow {
  id: string;
  label: string;
  position: number;
}

// Participant response shape for card sort
// open: categories created by participant; closed: uses researcher categories
export interface CardSortResponseData {
  sort_type: "open" | "closed";
  groups: { category_id: string | null; category_label: string; card_ids: string[] }[];
  unsorted_card_ids: string[];
}

export interface FirstClickZone {
  /** All values are percentages of the image (0-100). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FirstClickConfig {
  task: string;
  image_url: string;
  correct_zone?: FirstClickZone | null;
}

export interface TreeTestTask {
  id: string;
  text: string;
  correct_node_id: string;
}

export interface TreeTestConfig {
  tasks: TreeTestTask[];
  /** @deprecated single-task legacy — migrate to `tasks` */
  task?: string;
  /** @deprecated single-task legacy — migrate to `tasks` */
  correct_node_id?: string;
}

export const STUDY_TYPE_META: Record<
  StudyType,
  { label: string; description: string }
> = {
  survey: {
    label: "Survey",
    description: "Multiple choice, Likert, and open text questions.",
  },
  card_sort: {
    label: "Card sort",
    description: "Open or closed sorting to discover mental models.",
  },
  first_click: {
    label: "First click",
    description: "Where do users click first to complete a task?",
  },
  tree_test: {
    label: "Tree test",
    description: "Validate information architecture without UI.",
  },
};
