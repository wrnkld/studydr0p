// localStorage-backed draft for an unauthenticated user building a study.
// One draft at a time — keeps things simple and matches "Start for free".

import {
  CardSortConfig,
  FirstClickConfig,
  FiveSecondConfig,
  StudyType,
  SurveyConfig,
  TreeTestConfig,
} from "./types";

const KEY = "studydrop:draft";

export interface DraftCardRow {
  id: string;
  label: string;
  description: string;
  position: number;
}
export interface DraftCategoryRow {
  id: string;
  label: string;
  position: number;
}

export interface DraftTreeNode {
  id: string;
  label: string;
  parent_id: string | null;
  position: number;
}

export interface DraftStudy {
  type: StudyType;
  title: string;
  description: string;
  // type-specific payloads (only the relevant one is populated)
  cardSort?: {
    config: CardSortConfig;
    cards: DraftCardRow[];
    categories: DraftCategoryRow[];
  };
  survey?: {
    config: SurveyConfig;
  };
  firstClick?: {
    config: FirstClickConfig;
  };
  treeTest?: {
    config: TreeTestConfig;
    nodes: DraftTreeNode[];
  };
  fiveSecond?: {
    config: FiveSecondConfig;
  };
  updated_at: number;
}

export function loadDraft(): DraftStudy | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftStudy;
  } catch {
    return null;
  }
}

export function saveDraft(d: DraftStudy) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...d, updated_at: Date.now() }),
    );
  } catch {
    // quota or disabled — ignore silently
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function newDraft(type: StudyType): DraftStudy {
  const base: DraftStudy = {
    type,
    title: "",
    description: "",
    updated_at: Date.now(),
  };
  if (type === "card_sort") {
    base.cardSort = {
      config: { sort_type: "open" },
      cards: [],
      categories: [],
    };
  } else if (type === "survey") {
    base.survey = {
      config: { questions: [], layout: "single_page" },
    };
  } else if (type === "first_click") {
    base.firstClick = { config: { task: "", image_url: "" } };
  } else if (type === "tree_test") {
    base.treeTest = {
      config: { task: "", correct_node_id: "" },
      nodes: [],
    };
  } else if (type === "five_second") {
    base.fiveSecond = {
      config: { image_url: "", duration_ms: 5000, follow_up: [] },
    };
  }
  return base;
}
