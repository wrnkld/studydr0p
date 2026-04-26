// Participant-style survey for the gas station example.
// One question at a time. Next button advances. Submit on last question.
// No data is saved.

import { useState } from "react";

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
    options: ["Yes", "No", "I don't want to talk about it"],
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
      "Roller grill mystery item",
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

type Answers = Record<string, string | string[] | number>;

export default function GasStationSurveyDemo({
  onSubmit,
}: {
  onSubmit: () => void;
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
    <div className="bg-white text-black space-y-6">
      <div className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
        Question {step + 1} of {QUESTIONS.length}
      </div>

      <h2 className="text-2xl font-bold leading-tight">{q.label}</h2>

      <div>
        {q.type === "single" && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => {
              const selected = current === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(opt)}
                  className={`text-left border border-black px-3 py-2 text-sm ${
                    selected ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "multi" && (
          <div className="flex flex-col gap-2">
            {q.options.map((opt) => {
              const list = Array.isArray(current) ? current : [];
              const selected = list.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleMulti(opt)}
                  className={`text-left border border-black px-3 py-2 text-sm ${
                    selected ? "bg-black text-white" : "bg-white text-black"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {q.type === "rating" && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map(
              (n) => {
                const selected = current === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(n)}
                    className={`border border-black w-12 h-12 text-sm ${
                      selected ? "bg-black text-white" : "bg-white text-black"
                    }`}
                  >
                    {n}
                  </button>
                );
              },
            )}
          </div>
        )}

        {q.type === "text" && (
          <textarea
            value={typeof current === "string" ? current : ""}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            className="w-full border border-black p-3 text-sm bg-white text-black focus:outline-none rounded-none"
            placeholder=""
          />
        )}
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="border border-black bg-white text-black px-6 py-2 text-sm"
          >
            Back
          </button>
        )}
        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canAdvance}
            className="border border-black bg-black text-white px-6 py-2 text-sm disabled:bg-white disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
            className="border border-black bg-black text-white px-6 py-2 text-sm disabled:bg-white disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
