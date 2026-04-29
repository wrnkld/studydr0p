// Hardcoded example studies for the landing page.
//
// IMPORTANT: examples MUST feed the same components used by real studies
// (CardSortParticipant, SurveyParticipant, CardSortResults, SurveyResults).
// Never build parallel demo/result UIs — see mem://index.md core rule.
//
// This file only exports DATA (in the real component shapes) and seed
// responses (in the real ResponseRow shape). The components themselves
// are imported and rendered by the example study page directly.

import {
  CardRow,
  CardSortConfig,
  CardSortResponseData,
  CategoryRow,
  SurveyConfig,
  SurveyQuestion,
} from "@/lib/types";

export type ExampleStudyId = "fridge" | "gasstation";

export interface ExampleResponseRow {
  id: string;
  session_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface ExampleCardSort {
  id: "fridge";
  type: "card_sort";
  title: string;
  description: string;
  config: CardSortConfig;
  cards: CardRow[];
  categories: CategoryRow[];
  /** Seed responses in the real ResponseRow shape. */
  seedResponses: ExampleResponseRow[];
}

export interface ExampleSurvey {
  id: "gasstation";
  type: "survey";
  title: string;
  description: string;
  config: SurveyConfig;
  /** Seed responses in the real ResponseRow shape (data.answers). */
  seedResponses: ExampleResponseRow[];
}

export type ExampleStudy = ExampleCardSort | ExampleSurvey;

// ---------- Helpers ----------

function makeCard(label: string, position: number): CardRow {
  return { id: `fridge-${label.toLowerCase().replace(/\W+/g, "-")}`, label, description: null, position };
}

function makeCategory(label: string, position: number): CategoryRow {
  return { id: `fridge-cat-${label.toLowerCase().replace(/\W+/g, "-")}`, label, position };
}

const ts = (i: number) => new Date(2026, 3, 1, 12, i).toISOString();

// ---------- Card sort: Fridge ----------

const FRIDGE_CARDS: CardRow[] = [
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
].map((l, i) => makeCard(l, i));

const FRIDGE_CATEGORIES: CategoryRow[] = [
  "Door",
  "Top shelf",
  "Middle shelf",
  "Bottom shelf",
  "Freezer",
  "Trash",
].map((l, i) => makeCategory(l, i));

const cardId = (label: string) =>
  FRIDGE_CARDS.find((c) => c.label === label)!.id;
const catId = (label: string) =>
  FRIDGE_CATEGORIES.find((c) => c.label === label)!.id;

// 20 hand-crafted card-sort placements (card label -> category label).
const FRIDGE_PLACEMENTS: Record<string, string>[] = [
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

// Convert each placement into a CardSortResponseData (closed sort against
// the seeded categories). The Results component groups by category_id, so
// stable IDs matter.
function placementToResponseData(
  placement: Record<string, string>,
): CardSortResponseData {
  const groupsMap = new Map<string, { category_id: string; category_label: string; card_ids: string[] }>();
  for (const cat of FRIDGE_CATEGORIES) {
    groupsMap.set(cat.id, {
      category_id: cat.id,
      category_label: cat.label,
      card_ids: [],
    });
  }
  for (const [cardLabel, catLabel] of Object.entries(placement)) {
    const cid = cardId(cardLabel);
    const gid = catId(catLabel);
    groupsMap.get(gid)!.card_ids.push(cid);
  }
  return {
    sort_type: "closed",
    groups: Array.from(groupsMap.values()),
    unsorted_card_ids: [],
  };
}

const FRIDGE_SEED_RESPONSES: ExampleResponseRow[] = FRIDGE_PLACEMENTS.map(
  (p, i) => ({
    id: `fridge-resp-${i}`,
    session_id: `fridge-sess-${i}`,
    data: placementToResponseData(p) as unknown as Record<string, unknown>,
    created_at: ts(i),
  }),
);

export const FRIDGE_STUDY: ExampleCardSort = {
  id: "fridge",
  type: "card_sort",
  title: "Where does it go in the fridge?",
  description: "Sort each item into the part of the fridge it belongs in.",
  config: { sort_type: "closed" },
  cards: FRIDGE_CARDS,
  categories: FRIDGE_CATEGORIES,
  seedResponses: FRIDGE_SEED_RESPONSES,
};

// ---------- Survey: Gas station ----------

const GAS_QUESTIONS: SurveyQuestion[] = [
  {
    id: "q1",
    type: "multiple_choice",
    label: "Have you ever eaten a gas station hot dog?",
    options: ["Yes", "No"],
  },
  {
    id: "q2",
    type: "likert",
    label: "Rate your go-to gas station on food quality.",
  },
  {
    id: "q3",
    type: "multiple_choice",
    label: "Which of these have you eaten at a gas station?",
    options: [
      "Hot dog",
      "Taquito",
      "Donut",
      "Beef jerky",
      "Pizza slice",
      "Just snacks",
    ],
  },
  {
    id: "q4",
    type: "multiple_choice",
    label: "What's the best gas station chain for food?",
    options: ["Wawa", "Buc-ee's", "Sheetz", "Casey's", "7-Eleven", "They're all the same"],
  },
  {
    id: "q5",
    type: "open_text",
    label: "Describe your ideal gas station snack in one sentence.",
  },
];

export const GAS_STATION_CONFIG: SurveyConfig = {
  questions: GAS_QUESTIONS,
  layout: "single_page",
};

// 20 hand-crafted survey answers shaped like real responses
// ({ answers: { qid: value } }). q3 uses string[] for multi-select.
const GAS_ANSWER_SETS: Record<string, string | string[]>[] = [
  { q1: "Yes", q2: "4", q3: ["Hot dog", "Taquito"], q4: "Wawa", q5: "Slim Jim and a Gatorade." },
  { q1: "No",  q2: "2", q3: ["Just snacks"],         q4: "7-Eleven", q5: "Just water." },
  { q1: "Yes", q2: "3", q3: ["Beef jerky", "Donut"], q4: "Buc-ee's", q5: "Coffee and a donut." },
  { q1: "Yes", q2: "5", q3: ["Hot dog", "Pizza slice"], q4: "Sheetz", q5: "Hot pretzel, no question." },
  { q1: "No",  q2: "3", q3: ["Just snacks", "Beef jerky"], q4: "Casey's", q5: "Sour Patch Kids." },
  { q1: "Yes", q2: "4", q3: ["Taquito"], q4: "7-Eleven", q5: "Whatever's hot and rolling." },
  { q1: "No",  q2: "1", q3: ["Just snacks"], q4: "They're all the same", q5: "I avoid them entirely." },
  { q1: "Yes", q2: "4", q3: ["Hot dog", "Pizza slice", "Donut"], q4: "Wawa", q5: "Sandwich, fresh, with chips." },
  { q1: "Yes", q2: "5", q3: ["Hot dog"], q4: "Buc-ee's", q5: "Brisket sandwich, ideally." },
  { q1: "No",  q2: "2", q3: ["Donut"], q4: "Sheetz", q5: "Glazed donut and orange juice." },
  { q1: "Yes", q2: "4", q3: ["Hot dog", "Taquito", "Donut"], q4: "Wawa", q5: "Hoagie." },
  { q1: "Yes", q2: "5", q3: ["Beef jerky", "Hot dog"], q4: "Casey's", q5: "Casey's pizza is unbeatable." },
  { q1: "No",  q2: "2", q3: ["Just snacks"], q4: "7-Eleven", q5: "A bag of chips." },
  { q1: "Yes", q2: "3", q3: ["Taquito", "Beef jerky"], q4: "Buc-ee's", q5: "Beaver Nuggets." },
  { q1: "Yes", q2: "4", q3: ["Hot dog"], q4: "Sheetz", q5: "MTO sandwich at 2am." },
  { q1: "Yes", q2: "3", q3: ["Donut", "Taquito"], q4: "7-Eleven", q5: "Tornado and a Slurpee." },
  { q1: "No",  q2: "2", q3: ["Just snacks"], q4: "Wawa", q5: "Trail mix." },
  { q1: "Yes", q2: "4", q3: ["Hot dog", "Beef jerky"], q4: "Casey's", q5: "Pepperoni slice." },
  { q1: "Yes", q2: "3", q3: ["Pizza slice"], q4: "Sheetz", q5: "Two slices and a slushie." },
  { q1: "Yes", q2: "5", q3: ["Hot dog", "Donut"], q4: "Wawa", q5: "Sizzli for breakfast." },
];

const GAS_SEED_RESPONSES: ExampleResponseRow[] = GAS_ANSWER_SETS.map(
  (answers, i) => ({
    id: `gas-resp-${i}`,
    session_id: `gas-sess-${i}`,
    data: { answers } as Record<string, unknown>,
    created_at: ts(i),
  }),
);

export const GAS_STATION_STUDY: ExampleSurvey = {
  id: "gasstation",
  type: "survey",
  title: "Gas station food. No judgment.",
  description: "Five quick questions about gas station snacks.",
  config: GAS_STATION_CONFIG,
  seedResponses: GAS_SEED_RESPONSES,
};

export const EXAMPLE_STUDIES: ExampleStudy[] = [FRIDGE_STUDY, GAS_STATION_STUDY];

export function getExampleStudy(id: string): ExampleStudy | null {
  if (id === "fridge") return FRIDGE_STUDY;
  if (id === "gasstation") return GAS_STATION_STUDY;
  return null;
}

// Build a synthetic ResponseRow from a freshly-submitted card sort or survey
// so it can be appended to the seed list and shown in the real Results view.
export function makeUserCardSortResponse(
  data: CardSortResponseData,
): ExampleResponseRow {
  return {
    id: "user-card-sort",
    session_id: "user",
    data: data as unknown as Record<string, unknown>,
    created_at: new Date().toISOString(),
  };
}

export function makeUserSurveyResponse(
  answers: Record<string, string | string[]>,
): ExampleResponseRow {
  return {
    id: "user-survey",
    session_id: "user",
    data: { answers } as Record<string, unknown>,
    created_at: new Date().toISOString(),
  };
}
