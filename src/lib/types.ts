// Shared app types — study configs

export type StudyType =
  | "card_sort"
  | "survey"
  | "first_click"
  | "tree_test"
  | "five_second";

export type StudyStatus = "draft" | "live" | "closed";

// Survey config
export type SurveyQuestionType = "multiple_choice" | "likert" | "open_text";

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  label: string;
  options?: string[]; // for multiple_choice
  multi?: boolean; // for multiple_choice: allow selecting multiple options
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

export interface FirstClickConfig {
  task: string;
  image_url: string;
}

export interface TreeTestConfig {
  task: string;
  correct_node_id: string;
}

export interface FiveSecondConfig {
  image_url: string;
  duration_ms: number;
  follow_up: SurveyQuestion[];
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
    label: "First-click test",
    description: "Where do users click first to complete a task?",
  },
  tree_test: {
    label: "Tree test",
    description: "Validate information architecture without UI.",
  },
  five_second: {
    label: "Five-second test",
    description: "Measure first impressions of a design.",
  },
};
