import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { SurveyConfig, SurveyQuestion } from "@/lib/types";
import { toast } from "sonner";
import { SectionHeader } from "@/components/study/primitives";

interface Props {
  study: {
    id: string;
    title: string;
    description: string | null;
    config: SurveyConfig;
  };
  sessionId: string;
  startedAt: number;
  preview?: boolean;
  /**
   * In-memory mode: skip all Supabase writes. The submitted answers are
   * passed back via `onSubmitInMemory`. Used by canned example studies
   * so they exercise the same component as real studies.
   */
  inMemory?: boolean;
  onSubmitInMemory?: (answers: Record<string, string | string[]>) => void;
  onDone: () => void;
}

export default function SurveyParticipant({
  study,
  sessionId,
  startedAt,
  preview = false,
  inMemory = false,
  onSubmitInMemory,
  onDone,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    for (const q of study.config.questions) {
      const a = answers[q.id];
      if (a === undefined || a === "" || (Array.isArray(a) && a.length === 0)) {
        toast.error("Please answer all questions");
        return;
      }
    }
    setSubmitting(true);
    if (inMemory) {
      onSubmitInMemory?.(answers);
      setSubmitting(false);
      onDone();
      return;
    }
    if (preview) {
      setSubmitting(false);
      onDone();
      return;
    }
    const { error: respErr } = await supabase.from("responses").insert({
      study_id: study.id,
      session_id: sessionId,
      data: { answers },
    });
    if (respErr) {
      setSubmitting(false);
      toast.error(respErr.message);
      return;
    }
    await supabase
      .from("sessions")
      .update({
        completed_at: new Date().toISOString(),
        metadata: { duration_ms: Date.now() - startedAt },
      })
      .eq("id", sessionId);
    setSubmitting(false);
    toast.success("Thanks! Your response was recorded.");
    onDone();
  };

  const questions = study.config.questions;

  const content = (
    <div className="space-y-6">
      <ol className="space-y-8">
        {questions.map((q, i) => (
          <li key={q.id} className="space-y-4">
            <SectionHeader
              kicker={`Question ${i + 1}`}
              title={q.label || q.id}
            />
            <QuestionInput
              q={q}
              value={answers[q.id]}
              onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
            />
          </li>
        ))}
      </ol>
      <Button onClick={submit} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </div>
  );

  if (preview || inMemory) return content;

  return (
    <main className="container py-8 space-y-6">
      <div className="space-y-3">
        <h1>{study.title}</h1>
      </div>
      {content}
    </main>
  );
}

function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: SurveyQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  if (q.type === "open_text") {
    return (
      <Textarea
        rows={4}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (q.type === "likert") {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              type="button"
              variant={value === String(n) ? "default" : "outline"}
              onClick={() => onChange(String(n))}
              className="h-12 w-12"
            >
              {n}
            </Button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Strongly disagree</span>
          <span>Strongly agree</span>
        </div>
      </div>
    );
  }
  if (q.multi) {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (opt: string) => {
      if (selected.includes(opt)) onChange(selected.filter((o) => o !== opt));
      else onChange([...selected, opt]);
    };
    return (
      <div className="space-y-2">
        {(q.options ?? []).map((opt, i) => {
          const checked = selected.includes(opt);
          return (
            <label
              key={i}
              className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt)}
                className="h-4 w-4"
              />
              <span>{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  return (
    <RadioGroup value={(value as string) ?? ""} onValueChange={onChange}>
      {(q.options ?? []).map((opt, i) => (
        <label
          key={i}
          className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-accent"
        >
          <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
          <span>{opt}</span>
        </label>
      ))}
    </RadioGroup>
  );
}
