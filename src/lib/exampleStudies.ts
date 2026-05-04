// Hardcoded example studies for the landing page.
//
// IMPORTANT: examples MUST feed the same components used by real studies
// (CardSortParticipant, SurveyParticipant, TreeTestParticipant,
// CardSortResults, SurveyResults, TreeTestResults).
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
  TreeTestConfig,
  TreeTestTask,
} from "@/lib/types";
import { TreeNodeRow, TaskResult } from "@/pages/participant/TreeTestParticipant";

export type ExampleStudyId = "fridge" | "gasstation" | "restaurant";

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
  seedResponses: ExampleResponseRow[];
}

export interface ExampleSurvey {
  id: "gasstation";
  type: "survey";
  title: string;
  description: string;
  config: SurveyConfig;
  seedResponses: ExampleResponseRow[];
}

export interface ExampleTreeTest {
  id: "restaurant";
  type: "tree_test";
  title: string;
  description: string;
  config: TreeTestConfig;
  nodes: TreeNodeRow[];
  seedResponses: ExampleResponseRow[];
}

export type ExampleStudy = ExampleCardSort | ExampleSurvey | ExampleTreeTest;

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
    multi: true,
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

// ---------- Tree test: Restaurant website ----------

// Node IDs (stable for seed data)
const n = (slug: string) => `rest-${slug}`;

const RESTAURANT_NODES: TreeNodeRow[] = [
  // Top-level
  { id: n("food"),          parent_id: null,              label: "Our Food",           position: 0 },
  { id: n("reservations"),  parent_id: null,              label: "Reservations",       position: 1 },
  { id: n("about"),         parent_id: null,              label: "About",              position: 2 },
  { id: n("contact"),       parent_id: null,              label: "Contact",            position: 3 },
  // Our Food children
  { id: n("breakfast"),     parent_id: n("food"),         label: "Breakfast",          position: 0 },
  { id: n("lunch"),         parent_id: n("food"),         label: "Lunch",              position: 1 },
  { id: n("dinner"),        parent_id: n("food"),         label: "Dinner",             position: 2 },
  { id: n("drinks"),        parent_id: n("food"),         label: "Drinks",             position: 3 },
  { id: n("desserts"),      parent_id: n("food"),         label: "Desserts",           position: 4 },
  // Reservations children
  { id: n("book"),          parent_id: n("reservations"), label: "Book a table",       position: 0 },
  { id: n("large"),         parent_id: n("reservations"), label: "Large groups",       position: 1 },
  { id: n("private"),       parent_id: n("reservations"), label: "Private dining",     position: 2 },
  // About children
  { id: n("story"),         parent_id: n("about"),        label: "Our story",          position: 0 },
  { id: n("team"),          parent_id: n("about"),        label: "Meet the team",      position: 1 },
  { id: n("press"),         parent_id: n("about"),        label: "Press",              position: 2 },
  // Contact children
  { id: n("findus"),        parent_id: n("contact"),      label: "Find us",            position: 0 },
  { id: n("hours"),         parent_id: n("contact"),      label: "Hours",              position: 1 },
  { id: n("catering"),      parent_id: n("contact"),      label: "Catering inquiries", position: 2 },
];

const RESTAURANT_TASKS: TreeTestTask[] = [
  {
    id: "t1",
    text: "Find where you'd go to book a table for 2.",
    correct_node_id: n("book"),
  },
  {
    id: "t2",
    text: "Find the dessert menu.",
    correct_node_id: n("desserts"),
  },
  {
    id: "t3",
    text: "Find out what time the restaurant opens.",
    correct_node_id: n("hours"),
  },
];

const RESTAURANT_CONFIG: TreeTestConfig = {
  tasks: RESTAURANT_TASKS,
};

// 20 seeded responses — varying success, paths, wrong answers
function makeTreeResponse(
  i: number,
  taskResults: Array<{
    taskIdx: number;
    selectedId: string;
    pathIds: string[];
    durationMs: number;
  }>,
): ExampleResponseRow {
  const tasks: TaskResult[] = taskResults.map((tr) => {
    const task = RESTAURANT_TASKS[tr.taskIdx];
    return {
      task_id: task.id,
      task_text: task.text,
      correct_node_id: task.correct_node_id,
      selected_node_id: tr.selectedId,
      selected_label: RESTAURANT_NODES.find((nd) => nd.id === tr.selectedId)?.label ?? "",
      path: tr.pathIds.map((pid, j) => ({
        node_id: pid,
        label: RESTAURANT_NODES.find((nd) => nd.id === pid)?.label ?? "",
        at_ms: 1000 * (j + 1),
      })),
      duration_ms: tr.durationMs,
    };
  });
  return {
    id: `rest-resp-${i}`,
    session_id: `rest-sess-${i}`,
    data: { tasks, duration_ms: taskResults.reduce((s, t) => s + t.durationMs, 0) } as unknown as Record<string, unknown>,
    created_at: ts(i),
  };
}

// Hand-crafted response patterns:
// Task 1 correct = book, Task 2 correct = desserts, Task 3 correct = hours
const RESTAURANT_SEED_RESPONSES: ExampleResponseRow[] = [
  // 1: All correct, direct
  makeTreeResponse(0, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],         durationMs: 4200 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],             durationMs: 3100 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],             durationMs: 3800 },
  ]),
  // 2: All correct, some backtracking
  makeTreeResponse(1, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("food"), n("reservations"), n("book")],     durationMs: 6500 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 3400 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("about"), n("contact"), n("hours")],         durationMs: 5200 },
  ]),
  // 3: Task 1 wrong (went to large groups), rest correct
  makeTreeResponse(2, [
    { taskIdx: 0, selectedId: n("large"),    pathIds: [n("reservations"), n("large")],               durationMs: 5100 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2900 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3500 },
  ]),
  // 4: All correct, direct
  makeTreeResponse(3, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3800 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2700 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3200 },
  ]),
  // 5: Task 3 wrong (went to findus)
  makeTreeResponse(4, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 4000 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 3300 },
    { taskIdx: 2, selectedId: n("findus"),   pathIds: [n("contact"), n("findus")],                   durationMs: 4100 },
  ]),
  // 6: Task 2 wrong (went to drinks)
  makeTreeResponse(5, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3900 },
    { taskIdx: 1, selectedId: n("drinks"),   pathIds: [n("food"), n("drinks")],                       durationMs: 4500 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3700 },
  ]),
  // 7: All correct, backtracking on task 1
  makeTreeResponse(6, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("contact"), n("reservations"), n("book")],   durationMs: 7200 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 3000 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3300 },
  ]),
  // 8: Task 1 wrong (private dining), rest correct
  makeTreeResponse(7, [
    { taskIdx: 0, selectedId: n("private"),  pathIds: [n("reservations"), n("private")],             durationMs: 4800 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2800 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3600 },
  ]),
  // 9: All correct, direct
  makeTreeResponse(8, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3500 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2600 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3100 },
  ]),
  // 10: Task 3 wrong (catering), rest correct
  makeTreeResponse(9, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 4100 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 3200 },
    { taskIdx: 2, selectedId: n("catering"), pathIds: [n("contact"), n("catering")],                 durationMs: 5500 },
  ]),
  // 11: All correct
  makeTreeResponse(10, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3700 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2900 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3400 },
  ]),
  // 12: Task 2 wrong (lunch)
  makeTreeResponse(11, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 4300 },
    { taskIdx: 1, selectedId: n("lunch"),    pathIds: [n("food"), n("lunch")],                       durationMs: 5000 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3600 },
  ]),
  // 13: All correct, backtracking
  makeTreeResponse(12, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("about"), n("reservations"), n("book")],     durationMs: 6800 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("breakfast"), n("food"), n("desserts")], durationMs: 5400 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3200 },
  ]),
  // 14: Task 1 wrong (large), task 3 wrong (findus)
  makeTreeResponse(13, [
    { taskIdx: 0, selectedId: n("large"),    pathIds: [n("reservations"), n("large")],               durationMs: 4600 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 3100 },
    { taskIdx: 2, selectedId: n("findus"),   pathIds: [n("contact"), n("findus")],                   durationMs: 4200 },
  ]),
  // 15: All correct, direct
  makeTreeResponse(14, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3600 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2500 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3000 },
  ]),
  // 16: All correct
  makeTreeResponse(15, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 4000 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 3100 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3500 },
  ]),
  // 17: Task 2 wrong (drinks), backtracking task 3
  makeTreeResponse(16, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3800 },
    { taskIdx: 1, selectedId: n("drinks"),   pathIds: [n("food"), n("drinks")],                       durationMs: 4200 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("about"), n("contact"), n("hours")],         durationMs: 5800 },
  ]),
  // 18: All correct, direct
  makeTreeResponse(17, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3400 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2700 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3100 },
  ]),
  // 19: Task 3 wrong (story)
  makeTreeResponse(18, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 4200 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 3000 },
    { taskIdx: 2, selectedId: n("story"),    pathIds: [n("about"), n("story")],                       durationMs: 6100 },
  ]),
  // 20: All correct
  makeTreeResponse(19, [
    { taskIdx: 0, selectedId: n("book"),     pathIds: [n("reservations"), n("book")],                 durationMs: 3900 },
    { taskIdx: 1, selectedId: n("desserts"), pathIds: [n("food"), n("desserts")],                     durationMs: 2800 },
    { taskIdx: 2, selectedId: n("hours"),    pathIds: [n("contact"), n("hours")],                     durationMs: 3300 },
  ]),
];

export const RESTAURANT_STUDY: ExampleTreeTest = {
  id: "restaurant",
  type: "tree_test",
  title: "Where's the menu item?",
  description: "Navigate this restaurant website to complete each task.",
  config: RESTAURANT_CONFIG,
  nodes: RESTAURANT_NODES,
  seedResponses: RESTAURANT_SEED_RESPONSES,
};

// ---------- Exports ----------

export const EXAMPLE_STUDIES: ExampleStudy[] = [FRIDGE_STUDY, GAS_STATION_STUDY, RESTAURANT_STUDY];

export function getExampleStudy(id: string): ExampleStudy | null {
  if (id === "fridge") return FRIDGE_STUDY;
  if (id === "gasstation") return GAS_STATION_STUDY;
  if (id === "restaurant") return RESTAURANT_STUDY;
  return null;
}

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

export function makeUserTreeTestResponse(
  data: { tasks: TaskResult[]; duration_ms: number },
): ExampleResponseRow {
  return {
    id: "user-tree-test",
    session_id: "user",
    data: data as unknown as Record<string, unknown>,
    created_at: new Date().toISOString(),
  };
}
