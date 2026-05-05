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

export type ExampleStudyId = "fridge" | "gasstation" | "grocery";

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
  id: "grocery";
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

// ---------- Tree test: Grocery store ----------

const g = (slug: string) => `groc-${slug}`;

const GROCERY_NODES: TreeNodeRow[] = [
  // Top-level
  { id: g("fresh"),      parent_id: null,           label: "Fresh",              position: 0 },
  { id: g("pantry"),     parent_id: null,           label: "Pantry",             position: 1 },
  { id: g("frozen"),     parent_id: null,           label: "Frozen",             position: 2 },
  { id: g("beverages"),  parent_id: null,           label: "Beverages",          position: 3 },
  { id: g("health"),     parent_id: null,           label: "Health & Beauty",    position: 4 },
  // Fresh children
  { id: g("produce"),    parent_id: g("fresh"),     label: "Produce",            position: 0 },
  { id: g("meat"),       parent_id: g("fresh"),     label: "Meat & Seafood",     position: 1 },
  { id: g("deli"),       parent_id: g("fresh"),     label: "Deli",               position: 2 },
  { id: g("bakery"),     parent_id: g("fresh"),     label: "Bakery",             position: 3 },
  { id: g("dairy"),      parent_id: g("fresh"),     label: "Dairy & Eggs",       position: 4 },
  // Pantry children
  { id: g("canned"),     parent_id: g("pantry"),    label: "Canned & Jarred",    position: 0 },
  { id: g("pasta"),      parent_id: g("pantry"),    label: "Pasta & Grains",     position: 1 },
  { id: g("condiments"), parent_id: g("pantry"),    label: "Condiments & Sauces",position: 2 },
  { id: g("snacks"),     parent_id: g("pantry"),    label: "Snacks",             position: 3 },
  { id: g("breakfast"),  parent_id: g("pantry"),    label: "Breakfast & Cereal", position: 4 },
  // Frozen children
  { id: g("frozmeals"), parent_id: g("frozen"),     label: "Frozen Meals",       position: 0 },
  { id: g("frozveg"),   parent_id: g("frozen"),     label: "Frozen Vegetables",  position: 1 },
  { id: g("icecream"),  parent_id: g("frozen"),     label: "Ice Cream & Desserts",position: 2 },
  { id: g("frozbfast"), parent_id: g("frozen"),     label: "Frozen Breakfast",   position: 3 },
  // Beverages children
  { id: g("water"),      parent_id: g("beverages"), label: "Water & Sparkling",  position: 0 },
  { id: g("juice"),      parent_id: g("beverages"), label: "Juice & Smoothies",  position: 1 },
  { id: g("coffee"),     parent_id: g("beverages"), label: "Coffee & Tea",       position: 2 },
  { id: g("alcohol"),    parent_id: g("beverages"), label: "Beer Wine & Spirits",position: 3 },
  // Health & Beauty children
  { id: g("vitamins"),   parent_id: g("health"),    label: "Vitamins",           position: 0 },
  { id: g("personal"),   parent_id: g("health"),    label: "Personal Care",      position: 1 },
];

const GROCERY_TASKS: TreeTestTask[] = [
  { id: "t1", text: "Find where you'd look for Greek yogurt",       correct_node_id: g("dairy") },
  { id: "t2", text: "Find almond butter",                           correct_node_id: g("condiments") },
  { id: "t3", text: "Find sparkling water",                         correct_node_id: g("water") },
  { id: "t4", text: "Find a rotisserie chicken",                    correct_node_id: g("deli") },
];

const GROCERY_CONFIG: TreeTestConfig = { tasks: GROCERY_TASKS };

function makeGroceryResponse(
  i: number,
  taskResults: Array<{
    taskIdx: number;
    selectedId: string;
    pathIds: string[];
    durationMs: number;
  }>,
): ExampleResponseRow {
  const tasks: TaskResult[] = taskResults.map((tr) => {
    const task = GROCERY_TASKS[tr.taskIdx];
    return {
      task_id: task.id,
      task_text: task.text,
      correct_node_id: task.correct_node_id,
      selected_node_id: tr.selectedId,
      selected_label: GROCERY_NODES.find((nd) => nd.id === tr.selectedId)?.label ?? "",
      path: tr.pathIds.map((pid, j) => ({
        node_id: pid,
        label: GROCERY_NODES.find((nd) => nd.id === pid)?.label ?? "",
        at_ms: 1000 * (j + 1),
      })),
      duration_ms: tr.durationMs,
    };
  });
  return {
    id: `groc-resp-${i}`,
    session_id: `groc-sess-${i}`,
    data: { tasks, duration_ms: taskResults.reduce((s, t) => s + t.durationMs, 0) } as unknown as Record<string, unknown>,
    created_at: ts(i),
  };
}

// 20 hand-crafted responses with realistic confusion
// Task 1 (yogurt): correct=dairy, confused with produce, health/vitamins
// Task 2 (almond butter): correct=condiments, confused with snacks, breakfast
// Task 3 (sparkling water): correct=water, confused with juice
// Task 4 (rotisserie chicken): correct=deli, confused with meat, frozmeals
const GROCERY_SEED_RESPONSES: ExampleResponseRow[] = [
  // 1: All correct, direct
  makeGroceryResponse(0, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3200 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 4100 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2800 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3500 },
  ]),
  // 2: Yogurt wrong (produce), almond butter wrong (snacks)
  makeGroceryResponse(1, [
    { taskIdx: 0, selectedId: g("produce"),    pathIds: [g("fresh"), g("produce")],                        durationMs: 3800 },
    { taskIdx: 1, selectedId: g("snacks"),     pathIds: [g("pantry"), g("snacks")],                        durationMs: 5200 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 3100 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3900 },
  ]),
  // 3: All correct, backtracking on almond butter
  makeGroceryResponse(2, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3400 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("snacks"), g("pantry"), g("condiments")], durationMs: 7200 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2900 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3300 },
  ]),
  // 4: Yogurt wrong (health/vitamins), chicken wrong (meat)
  makeGroceryResponse(3, [
    { taskIdx: 0, selectedId: g("vitamins"),   pathIds: [g("health"), g("vitamins")],                      durationMs: 5500 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 4300 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 3000 },
    { taskIdx: 3, selectedId: g("meat"),       pathIds: [g("fresh"), g("meat")],                           durationMs: 4100 },
  ]),
  // 5: All correct, direct
  makeGroceryResponse(4, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 2900 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 3800 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2600 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3200 },
  ]),
  // 6: Almond butter wrong (breakfast), sparkling water wrong (juice)
  makeGroceryResponse(5, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3100 },
    { taskIdx: 1, selectedId: g("breakfast"),  pathIds: [g("pantry"), g("breakfast")],                     durationMs: 5800 },
    { taskIdx: 2, selectedId: g("juice"),      pathIds: [g("beverages"), g("juice")],                      durationMs: 4500 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3600 },
  ]),
  // 7: All correct, backtracking on yogurt
  makeGroceryResponse(6, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("produce"), g("fresh"), g("dairy")],durationMs: 6100 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 4000 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2700 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3100 },
  ]),
  // 8: Yogurt wrong (produce), almond butter wrong (snacks), chicken wrong (frozmeals)
  makeGroceryResponse(7, [
    { taskIdx: 0, selectedId: g("produce"),    pathIds: [g("fresh"), g("produce")],                        durationMs: 3700 },
    { taskIdx: 1, selectedId: g("snacks"),     pathIds: [g("pantry"), g("snacks")],                        durationMs: 4600 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 3200 },
    { taskIdx: 3, selectedId: g("frozmeals"),  pathIds: [g("frozen"), g("frozmeals")],                     durationMs: 5100 },
  ]),
  // 9: All correct
  makeGroceryResponse(8, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3000 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 3900 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2500 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3400 },
  ]),
  // 10: Almond butter wrong (breakfast), chicken wrong (meat)
  makeGroceryResponse(9, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3300 },
    { taskIdx: 1, selectedId: g("breakfast"),  pathIds: [g("pantry"), g("breakfast")],                     durationMs: 5400 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2800 },
    { taskIdx: 3, selectedId: g("meat"),       pathIds: [g("fresh"), g("meat")],                           durationMs: 4700 },
  ]),
  // 11: All correct, direct
  makeGroceryResponse(10, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 2800 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 3700 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2400 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3000 },
  ]),
  // 12: Yogurt wrong (produce), sparkling water wrong (juice)
  makeGroceryResponse(11, [
    { taskIdx: 0, selectedId: g("produce"),    pathIds: [g("fresh"), g("produce")],                        durationMs: 3600 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 4200 },
    { taskIdx: 2, selectedId: g("juice"),      pathIds: [g("beverages"), g("juice")],                      durationMs: 4800 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3500 },
  ]),
  // 13: All correct, backtracking on chicken
  makeGroceryResponse(12, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3100 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 3800 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2600 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("meat"), g("fresh"), g("deli")],    durationMs: 6800 },
  ]),
  // 14: Almond butter wrong (snacks)
  makeGroceryResponse(13, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3200 },
    { taskIdx: 1, selectedId: g("snacks"),     pathIds: [g("pantry"), g("snacks")],                        durationMs: 4900 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2700 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3400 },
  ]),
  // 15: All correct
  makeGroceryResponse(14, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 2700 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 3600 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2300 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 2900 },
  ]),
  // 16: Yogurt wrong (health/personal care), chicken wrong (meat)
  makeGroceryResponse(15, [
    { taskIdx: 0, selectedId: g("personal"),   pathIds: [g("health"), g("personal")],                      durationMs: 6200 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 4100 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 3000 },
    { taskIdx: 3, selectedId: g("meat"),       pathIds: [g("fresh"), g("meat")],                           durationMs: 4400 },
  ]),
  // 17: All correct, backtracking on almond butter
  makeGroceryResponse(16, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3000 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("breakfast"), g("pantry"), g("condiments")], durationMs: 7500 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2500 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3200 },
  ]),
  // 18: Almond butter wrong (breakfast), chicken wrong (frozmeals)
  makeGroceryResponse(17, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 3400 },
    { taskIdx: 1, selectedId: g("breakfast"),  pathIds: [g("pantry"), g("breakfast")],                     durationMs: 5100 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2900 },
    { taskIdx: 3, selectedId: g("frozmeals"),  pathIds: [g("frozen"), g("frozmeals")],                     durationMs: 5300 },
  ]),
  // 19: All correct, direct
  makeGroceryResponse(18, [
    { taskIdx: 0, selectedId: g("dairy"),      pathIds: [g("fresh"), g("dairy")],                          durationMs: 2600 },
    { taskIdx: 1, selectedId: g("condiments"), pathIds: [g("pantry"), g("condiments")],                    durationMs: 3500 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 2200 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 2800 },
  ]),
  // 20: Yogurt wrong (produce), almond butter wrong (snacks)
  makeGroceryResponse(19, [
    { taskIdx: 0, selectedId: g("produce"),    pathIds: [g("fresh"), g("produce")],                        durationMs: 3900 },
    { taskIdx: 1, selectedId: g("snacks"),     pathIds: [g("pantry"), g("snacks")],                        durationMs: 5000 },
    { taskIdx: 2, selectedId: g("water"),      pathIds: [g("beverages"), g("water")],                      durationMs: 3100 },
    { taskIdx: 3, selectedId: g("deli"),       pathIds: [g("fresh"), g("deli")],                           durationMs: 3600 },
  ]),
];

export const GROCERY_STUDY: ExampleTreeTest = {
  id: "grocery",
  type: "tree_test",
  title: "Help us stock the shelves.",
  description: "Click through the menu below. When you find your answer, click it to select, then confirm.",
  config: GROCERY_CONFIG,
  nodes: GROCERY_NODES,
  seedResponses: GROCERY_SEED_RESPONSES,
};

// ---------- Exports ----------

export const EXAMPLE_STUDIES: ExampleStudy[] = [FRIDGE_STUDY, GAS_STATION_STUDY, GROCERY_STUDY];

export function getExampleStudy(id: string): ExampleStudy | null {
  if (id === "fridge") return FRIDGE_STUDY;
  if (id === "gasstation") return GAS_STATION_STUDY;
  if (id === "grocery") return GROCERY_STUDY;
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
