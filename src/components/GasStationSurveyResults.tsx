// Survey results for the "Gas station food. No judgment." example.
// Seed data is hand-crafted to tell a believable story; if `userAnswers`
// is provided (the visitor just submitted the demo), their answers are
// merged in so the displayed numbers tick up by 1 each.

import { useMemo } from "react";
import {
  ChoiceChart,
  ScaleChart,
  SurveyChart,
  TextResponses,
  type CountMap,
} from "@/components/survey/SurveyChart";
import { SectionHeader, Stat, StatGrid } from "@/components/study/primitives";

// ---------- Seed data ----------
const SEED_TOTAL = 20;

// Q1: yes/no
const Q1_OPTIONS = ["Yes", "No"];
const Q1_SEED: CountMap = { Yes: 13, No: 7 };

// Q2: 1-10 rating, distribution averaging ~5.8
const Q2_SEED: CountMap = {
  "1": 1,
  "2": 1,
  "3": 2,
  "4": 2,
  "5": 3,
  "6": 3,
  "7": 3,
  "8": 3,
  "9": 1,
  "10": 1,
};

// Q3: multi-select. Counts can sum > total.
const Q3_OPTIONS = [
  "Beef jerky",
  "Taquito",
  "Donut",
  "Hot dog",
  "Just snacks",
  "Pizza slice",
];
const Q3_SEED: CountMap = {
  "Beef jerky": 17,
  Taquito: 16,
  Donut: 13,
  "Hot dog": 10,
  "Just snacks": 8,
  "Pizza slice": 7,
};

// Q4: best chain
const Q4_OPTIONS = [
  "Wawa",
  "Buc-ee's",
  "Sheetz",
  "Casey's",
  "7-Eleven",
  "They're all the same",
];
const Q4_SEED: CountMap = {
  Wawa: 7,
  "Buc-ee's": 5,
  Sheetz: 3,
  "Casey's": 2,
  "7-Eleven": 2,
  "They're all the same": 1,
};

// Q5: open text
const Q5_SEED: string[] = [
  "A Slim Jim and a large coffee, that's it.",
  "Hot chips and a Gatorade, every time.",
  "I only buy water",
  "Water and some sorta granola bar",
  "Sheetz or Wawa sandwich",
];

// Shape of submission from GasStationSurveyDemo — keys are q1..q5.
export interface GasStationAnswers {
  q1?: string;
  q2?: number;
  q3?: string[];
  q4?: string;
  q5?: string;
}

interface Props {
  /** When present, increment seed counts by the visitor's submission. */
  userAnswers?: GasStationAnswers;
}

function withInc(seed: CountMap, key: string | undefined): CountMap {
  if (!key) return seed;
  return { ...seed, [key]: (seed[key] ?? 0) + 1 };
}

function withIncMany(seed: CountMap, keys: string[] | undefined): CountMap {
  if (!keys || keys.length === 0) return seed;
  const out = { ...seed };
  keys.forEach((k) => (out[k] = (out[k] ?? 0) + 1));
  return out;
}

export default function GasStationSurveyResults({ userAnswers }: Props) {
  const data = useMemo(() => {
    const total = SEED_TOTAL + (userAnswers ? 1 : 0);
    return {
      total,
      q1: withInc(Q1_SEED, userAnswers?.q1),
      q2: withInc(Q2_SEED, userAnswers?.q2 != null ? String(userAnswers.q2) : undefined),
      q3: withIncMany(Q3_SEED, userAnswers?.q3),
      q4: withInc(Q4_SEED, userAnswers?.q4),
      q5: userAnswers?.q5 && userAnswers.q5.trim().length > 0
        ? [userAnswers.q5.trim(), ...Q5_SEED]
        : Q5_SEED,
    };
  }, [userAnswers]);

  const q2Avg = useMemo(() => {
    const entries = Object.entries(data.q2);
    const sum = entries.reduce((s, [k, v]) => s + Number(k) * v, 0);
    const n = entries.reduce((s, [, v]) => s + v, 0);
    return n > 0 ? sum / n : 0;
  }, [data.q2]);

  return (
    <div className="space-y-8">
      <StatGrid>
        <Stat label="Responses" value={String(data.total)} />
        <Stat label="Questions" value="5" />
        <Stat label="Avg score" value={`${q2Avg.toFixed(1)} / 10`} />
      </StatGrid>

      <QuestionSection
        number={1}
        title="Have you ever eaten a gas station hot dog?"
      >
        <SurveyChart
          kind="choice"
          options={Q1_OPTIONS}
          counts={data.q1}
          total={data.total}
        />
      </QuestionSection>

      <QuestionSection
        number={2}
        title="Rate your go-to gas station on food quality."
      >
        <ScaleChart min={1} max={10} counts={data.q2} />
      </QuestionSection>

      <QuestionSection
        number={3}
        title="Which of these have you eaten at a gas station?"
      >
        {/* multi-select: total here is the participant count, not the sum of
            checks, so percentages reflect "share of participants". */}
        <ChoiceChart
          options={Q3_OPTIONS}
          counts={data.q3}
          total={data.total}
        />
      </QuestionSection>

      <QuestionSection
        number={4}
        title="What's the best gas station chain for food?"
      >
        <ChoiceChart
          options={Q4_OPTIONS}
          counts={data.q4}
          total={data.total}
        />
      </QuestionSection>

      <QuestionSection
        number={5}
        title="Describe your ideal gas station snack in one sentence."
      >
        <TextResponses responses={data.q5} />
      </QuestionSection>
    </div>
  );
}

// (local Stat removed — now imported from @/components/study/primitives)

function QuestionSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader kicker={`Question ${number}`} title={title} />
      {children}
    </section>
  );
}
