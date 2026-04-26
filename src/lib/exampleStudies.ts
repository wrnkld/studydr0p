// Hardcoded example studies for the landing page.
// No backend calls — purely illustrative data showing realistic results.

export type ExampleStudyId = "fridge" | "remote-work";

export interface ExampleCardSort {
  id: "fridge";
  type: "card_sort";
  title: string;
  question: string;
  cards: string[];
  categories: string[];
  // For each response, a mapping of card -> category
  responses: Record<string, string>[];
}

export interface ExampleSurvey {
  id: "remote-work";
  type: "survey";
  title: string;
  question: string;
  questions: {
    id: string;
    label: string;
    type: "multiple_choice" | "likert" | "open_text";
    options?: string[];
  }[];
  // Each response: question_id -> answer
  responses: Record<string, string>[];
}

export type ExampleStudy = ExampleCardSort | ExampleSurvey;

// ---------- Card sort: Fridge ----------

const FRIDGE_CARDS = [
  "Ketchup",
  "Mayo",
  "Leftover pizza",
  "Beer",
  "Oat milk",
  "Mystery tupperware",
  "Wilting spinach",
  "Cheese",
  "Hot sauce",
  "Birthday cake",
  "Baking soda",
  "Eggs",
];

const FRIDGE_CATS = [
  "Door",
  "Top shelf",
  "Middle shelf",
  "Bottom shelf",
  "Freezer",
  "Trash",
];

// 20 hand-crafted responses with realistic disagreement.
const FRIDGE_RESPONSES: Record<string, string>[] = [
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Door", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Door", Eggs: "Top shelf" },
  { Ketchup: "Middle shelf", Mayo: "Middle shelf", "Leftover pizza": "Top shelf", Beer: "Door", "Oat milk": "Top shelf", "Mystery tupperware": "Middle shelf", "Wilting spinach": "Bottom shelf", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Middle shelf", "Baking soda": "Top shelf", Eggs: "Door" },
  { Ketchup: "Door", Mayo: "Middle shelf", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Door", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Freezer", "Baking soda": "Door", Eggs: "Middle shelf" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Top shelf", Beer: "Bottom shelf", "Oat milk": "Top shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Bottom shelf", Cheese: "Bottom shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Top shelf", Eggs: "Top shelf" },
  { Ketchup: "Middle shelf", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Door", "Oat milk": "Middle shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Bottom shelf", "Hot sauce": "Middle shelf", "Birthday cake": "Middle shelf", "Baking soda": "Bottom shelf", Eggs: "Door" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Door", "Oat milk": "Door", "Mystery tupperware": "Bottom shelf", "Wilting spinach": "Bottom shelf", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Door", Eggs: "Top shelf" },
  { Ketchup: "Door", Mayo: "Middle shelf", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Top shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Middle shelf", "Baking soda": "Bottom shelf", Eggs: "Door" },
  { Ketchup: "Middle shelf", Mayo: "Door", "Leftover pizza": "Top shelf", Beer: "Bottom shelf", "Oat milk": "Door", "Mystery tupperware": "Trash", "Wilting spinach": "Bottom shelf", Cheese: "Bottom shelf", "Hot sauce": "Door", "Birthday cake": "Freezer", "Baking soda": "Door", Eggs: "Top shelf" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Top shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Top shelf", Eggs: "Top shelf" },
  { Ketchup: "Door", Mayo: "Middle shelf", "Leftover pizza": "Bottom shelf", Beer: "Door", "Oat milk": "Door", "Mystery tupperware": "Middle shelf", "Wilting spinach": "Bottom shelf", Cheese: "Bottom shelf", "Hot sauce": "Middle shelf", "Birthday cake": "Middle shelf", "Baking soda": "Door", Eggs: "Door" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Top shelf", Beer: "Bottom shelf", "Oat milk": "Top shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Middle shelf", "Baking soda": "Top shelf", Eggs: "Top shelf" },
  { Ketchup: "Middle shelf", Mayo: "Middle shelf", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Door", "Mystery tupperware": "Trash", "Wilting spinach": "Bottom shelf", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Door", Eggs: "Door" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Door", "Oat milk": "Top shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Bottom shelf", "Hot sauce": "Door", "Birthday cake": "Freezer", "Baking soda": "Top shelf", Eggs: "Top shelf" },
  { Ketchup: "Door", Mayo: "Middle shelf", "Leftover pizza": "Top shelf", Beer: "Bottom shelf", "Oat milk": "Door", "Mystery tupperware": "Bottom shelf", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Bottom shelf", Eggs: "Top shelf" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Top shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Middle shelf", "Baking soda": "Door", Eggs: "Top shelf" },
  { Ketchup: "Middle shelf", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Door", "Oat milk": "Door", "Mystery tupperware": "Trash", "Wilting spinach": "Bottom shelf", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Top shelf", Eggs: "Door" },
  { Ketchup: "Door", Mayo: "Middle shelf", "Leftover pizza": "Bottom shelf", Beer: "Bottom shelf", "Oat milk": "Top shelf", "Mystery tupperware": "Middle shelf", "Wilting spinach": "Trash", Cheese: "Bottom shelf", "Hot sauce": "Middle shelf", "Birthday cake": "Middle shelf", "Baking soda": "Door", Eggs: "Top shelf" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Door", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Top shelf", Eggs: "Top shelf" },
  { Ketchup: "Middle shelf", Mayo: "Middle shelf", "Leftover pizza": "Top shelf", Beer: "Door", "Oat milk": "Top shelf", "Mystery tupperware": "Trash", "Wilting spinach": "Bottom shelf", Cheese: "Middle shelf", "Hot sauce": "Door", "Birthday cake": "Freezer", "Baking soda": "Door", Eggs: "Door" },
  { Ketchup: "Door", Mayo: "Door", "Leftover pizza": "Middle shelf", Beer: "Bottom shelf", "Oat milk": "Door", "Mystery tupperware": "Trash", "Wilting spinach": "Trash", Cheese: "Bottom shelf", "Hot sauce": "Door", "Birthday cake": "Top shelf", "Baking soda": "Door", Eggs: "Top shelf" },
];

export const FRIDGE_STUDY: ExampleCardSort = {
  id: "fridge",
  type: "card_sort",
  title: "Where does it go in the fridge?",
  question: "Sort each item into the part of the fridge it belongs in.",
  cards: FRIDGE_CARDS,
  categories: FRIDGE_CATS,
  responses: FRIDGE_RESPONSES,
};

// ---------- Survey: Remote work ----------

const REMOTE_QUESTIONS = [
  {
    id: "days_office",
    type: "multiple_choice" as const,
    label: "How many days per week do you want to be in the office?",
    options: ["0", "1", "2", "3", "4", "5"],
  },
  {
    id: "productivity",
    type: "likert" as const,
    label: "I'm more productive working from home than in the office.",
    options: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  },
  {
    id: "biggest_perk",
    type: "multiple_choice" as const,
    label: "Best thing about working remotely?",
    options: ["No commute", "Flexible hours", "Quieter focus time", "Comfort of home", "More time with family"],
  },
];

const REMOTE_RESPONSES: Record<string, string>[] = [
  { days_office: "2", productivity: "Agree", biggest_perk: "No commute" },
  { days_office: "0", productivity: "Strongly agree", biggest_perk: "Flexible hours" },
  { days_office: "3", productivity: "Neutral", biggest_perk: "No commute" },
  { days_office: "1", productivity: "Agree", biggest_perk: "Quieter focus time" },
  { days_office: "2", productivity: "Strongly agree", biggest_perk: "No commute" },
  { days_office: "0", productivity: "Strongly agree", biggest_perk: "Flexible hours" },
  { days_office: "5", productivity: "Disagree", biggest_perk: "Quieter focus time" },
  { days_office: "2", productivity: "Agree", biggest_perk: "No commute" },
  { days_office: "1", productivity: "Strongly agree", biggest_perk: "Comfort of home" },
  { days_office: "3", productivity: "Neutral", biggest_perk: "More time with family" },
  { days_office: "2", productivity: "Agree", biggest_perk: "No commute" },
  { days_office: "0", productivity: "Strongly agree", biggest_perk: "Flexible hours" },
  { days_office: "4", productivity: "Disagree", biggest_perk: "Quieter focus time" },
  { days_office: "2", productivity: "Agree", biggest_perk: "Flexible hours" },
  { days_office: "1", productivity: "Strongly agree", biggest_perk: "No commute" },
  { days_office: "2", productivity: "Neutral", biggest_perk: "Comfort of home" },
  { days_office: "3", productivity: "Agree", biggest_perk: "No commute" },
  { days_office: "0", productivity: "Strongly agree", biggest_perk: "Flexible hours" },
  { days_office: "2", productivity: "Agree", biggest_perk: "More time with family" },
  { days_office: "1", productivity: "Strongly agree", biggest_perk: "No commute" },
];

export const REMOTE_STUDY: ExampleSurvey = {
  id: "remote-work",
  type: "survey",
  title: "How do you actually want to work?",
  question: "20 people answered three questions about remote work.",
  questions: REMOTE_QUESTIONS,
  responses: REMOTE_RESPONSES,
};

export const EXAMPLE_STUDIES: ExampleStudy[] = [FRIDGE_STUDY, REMOTE_STUDY];

export function getExampleStudy(id: string): ExampleStudy | null {
  if (id === "fridge") return FRIDGE_STUDY;
  if (id === "remote-work") return REMOTE_STUDY;
  return null;
}

// ---------- Aggregation helpers ----------

// For card sort: per-card breakdown of category counts and most-common.
export function summarizeCardSort(study: ExampleCardSort) {
  return study.cards.map((card) => {
    const counts: Record<string, number> = {};
    study.responses.forEach((r) => {
      const cat = r[card];
      if (!cat) return;
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = study.responses.length;
    const top = sorted[0];
    const agreement = top ? Math.round((top[1] / total) * 100) : 0;
    return {
      card,
      counts,
      sorted,
      total,
      topCategory: top?.[0] ?? "—",
      agreement,
    };
  });
}

// For survey: per-question breakdown of answer counts.
export function summarizeSurvey(study: ExampleSurvey) {
  return study.questions.map((q) => {
    const counts: Record<string, number> = {};
    study.responses.forEach((r) => {
      const v = r[q.id];
      if (!v) return;
      counts[v] = (counts[v] ?? 0) + 1;
    });
    const total = study.responses.length;
    return { question: q, counts, total };
  });
}
