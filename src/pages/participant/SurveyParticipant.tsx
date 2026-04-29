import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { SurveyConfig, SurveyQuestion } from "@/lib/types";
import { toast } from "sonner";

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
  const isAnswered = (qid: string) => {
    const a = answers[qid];
    return !(a === undefined || a === "" || (Array.isArray(a) && a.length === 0));
  };
  const answeredCount = questions.filter((q) => isAnswered(q.id)).length;

  const content = (
    <div className="space-y-6">
      {questions.length > 0 && (
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={answeredCount}
          aria-label={`${answeredCount} of ${questions.length} questions answered`}
        >
          {questions.map((q) => (
            <div
              key={q.id}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor: isAnswered(q.id) ? "#4F75FF" : "#E5E7EB",
              }}
            />
          ))}
        </div>
      )}
      <ol className="space-y-8">
        {questions.map((q, i) => (
          <li key={q.id} className="space-y-3">
            <div className="text-sm text-muted-foreground">Question {i + 1}</div>
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
      <div className="space-y-2">
        <Label>{q.label}</Label>
        <Textarea
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  if (q.type === "likert") {
    return (
      <div className="space-y-3">
        <Label>{q.label}</Label>
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
  return (
    <div className="space-y-3">
      <Label>{q.label}</Label>
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
    </div>
  );
}
