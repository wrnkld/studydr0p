import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  /** When true, skip writing responses/sessions to the database. */
  preview?: boolean;
  onDone: () => void;
}

export default function SurveyParticipant({
  study,
  sessionId,
  startedAt,
  preview = false,
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
    if (preview) {
      // Don't pollute real data with preview submissions.
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
    onDone();
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-xl py-12">
        <h1 className="text-2xl font-semibold tracking-tight">{study.title}</h1>
        <ol className="mt-10 space-y-10">
          {study.config.questions.map((q, i) => (
            <li key={q.id} className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Question {i + 1}
              </div>
              <QuestionInput
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              />
            </li>
          ))}
        </ol>
        <Button className="mt-12 w-full sm:w-auto" size="lg" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </main>
    </div>
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
        <Label className="text-base font-normal">{q.label}</Label>
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
        <Label className="text-base font-normal">{q.label}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n))}
              className={`h-12 w-12 rounded-md border text-sm font-medium transition-colors ${
                value === String(n)
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-accent"
              }`}
            >
              {n}
            </button>
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
      <Label className="text-base font-normal">{q.label}</Label>
      <RadioGroup value={(value as string) ?? ""} onValueChange={onChange}>
        {(q.options ?? []).map((opt, i) => (
          <label
            key={i}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-accent/50"
          >
            <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
            <span>{opt}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
