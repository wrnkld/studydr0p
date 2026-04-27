// Participant-style survey for the gas station example.
// One question at a time. Next button advances. Submit on last question.
// No data is saved.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Chip, SectionHeader } from "@/components/study/primitives";

type Question =
  | { id: string; type: "single"; label: string; options: string[] }
  | { id: string; type: "multi"; label: string; options: string[] }
  | { id: string; type: "rating"; label: string; min: number; max: number }
  | { id: string; type: "text"; label: string };

const QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "single",
    label: "Have you ever eaten a gas station hot dog?",
    options: ["Yes", "No"],
  },
  {
    id: "q2",
    type: "rating",
    label: "Rate your go-to gas station on food quality.",
    min: 1,
    max: 10,
  },
  {
    id: "q3",
    type: "multi",
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
    type: "single",
    label: "What's the best gas station chain for food?",
    options: ["Wawa", "Buc-ee's", "Sheetz", "Casey's", "7-Eleven", "They're all the same"],
  },
  {
    id: "q5",
    type: "text",
    label: "Describe your ideal gas station snack in one sentence.",
  },
];

export type Answers = Record<string, string | string[] | number>;

export default function GasStationSurveyDemo({
  onSubmit,
}: {
  onSubmit: (answers: Answers) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const current = answers[q.id];

  const canAdvance =
    q.type === "multi"
      ? Array.isArray(current) && current.length > 0
      : q.type === "text"
      ? typeof current === "string" && current.trim().length > 0
      : current !== undefined && current !== "";

  const setAnswer = (v: string | string[] | number) =>
    setAnswers((a) => ({ ...a, [q.id]: v }));

  const toggleMulti = (opt: string) => {
    const list = Array.isArray(current) ? [...current] : [];
    const i = list.indexOf(opt);
    if (i >= 0) list.splice(i, 1);
    else list.push(opt);
    setAnswer(list);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker={`Question ${step + 1} of ${QUESTIONS.length}`}
        title={q.label}
      />

      <div>
        {q.type === "single" && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => (
              <Chip
                key={opt}
                block
                selected={current === opt}
                onClick={() => setAnswer(opt)}
              >
                {opt}
              </Chip>
            ))}
          </div>
        )}

        {q.type === "multi" && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => {
              const list = Array.isArray(current) ? current : [];
              const selected = list.includes(opt);
              return (
                <Chip
                  key={opt}
                  block
                  selected={selected}
                  onClick={() => toggleMulti(opt)}
                >
                  {opt}
                </Chip>
              );
            })}
          </div>
        )}

        {q.type === "rating" && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map(
              (n) => (
                <Chip
                  key={n}
                  size="icon"
                  selected={current === n}
                  onClick={() => setAnswer(n)}
                >
                  {n}
                </Chip>
              ),
            )}
          </div>
        )}

        {q.type === "text" && (
          <Textarea
            value={typeof current === "string" ? current : ""}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
          />
        )}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
        )}
        {isLast ? (
          <Button type="button" onClick={() => onSubmit(answers)} disabled={!canAdvance}>
            Submit
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
