// localStorage-backed draft for an unauthenticated user building a study.
// One draft at a time — keeps things simple and matches "Start for free".

import { CardSortConfig, StudyType, SurveyConfig } from "./types";

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
  }
  return base;
}
