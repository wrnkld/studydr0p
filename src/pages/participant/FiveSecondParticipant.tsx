import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { FiveSecondConfig } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  study: {
    id: string;
    title: string;
    description: string | null;
    config: FiveSecondConfig;
  };
  sessionId: string;
  startedAt: number;
  onDone: () => void;
}

type Phase = "showing" | "questions";

export default function FiveSecondParticipant({
  study,
  sessionId,
  startedAt,
  onDone,
}: Props) {
  const durationMs = study.config.duration_ms || 5000;
  const totalSeconds = Math.round(durationMs / 1000);
  const [phase, setPhase] = useState<Phase>("showing");
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (phase !== "showing") return;
    setSecondsLeft(totalSeconds);
    const startTime = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
      setSecondsLeft(remaining);
    }, 100);
    const end = setTimeout(() => {
      setPhase("questions");
    }, durationMs);
    return () => {
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [phase, durationMs, totalSeconds]);

  const submit = async () => {
    for (const q of study.config.follow_up) {
      if (!(answers[q.id] ?? "").trim()) {
        toast.error("Please answer all questions");
        return;
      }
    }
    setSubmitting(true);
    const { error: respErr } = await supabase.from("responses").insert({
      study_id: study.id,
      session_id: sessionId,
      data: { answers, image_url: study.config.image_url },
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

  if (phase === "ready") {
    return (
      <div className="min-h-screen bg-background">
        <main className="container max-w-xl py-16">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Five-second test
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{study.title}</h1>
          {study.description && (
            <p className="mt-4 whitespace-pre-wrap text-muted-foreground">
              {study.description}
            </p>
          )}
          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-5 text-sm">
            <p className="font-medium">How it works</p>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
              <li>You'll see an image for exactly {totalSeconds} seconds.</li>
              <li>The image will then disappear.</li>
              <li>Answer a few quick questions about what you remember.</li>
            </ol>
          </div>
          <Button size="lg" className="mt-8" onClick={() => setPhase("showing")}>
            I'm ready — start
          </Button>
        </main>
      </div>
    );
  }

  if (phase === "showing") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="border-b border-border">
          <div className="container flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">Memorize what you see</div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold tabular-nums text-background"
              aria-live="polite"
              aria-label={`${secondsLeft} seconds remaining`}
            >
              {secondsLeft}
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <img
            src={study.config.image_url}
            alt="Study stimulus"
            className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-xl py-12">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Time's up
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          What do you remember?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Answer based on your first impression. There are no right answers.
        </p>

        <ol className="mt-10 space-y-8">
          {study.config.follow_up.map((q, i) => (
            <li key={q.id} className="space-y-3">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Question {i + 1}
              </div>
              <Label className="text-base font-normal">{q.label}</Label>
              <Textarea
                rows={4}
                value={answers[q.id] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
                placeholder="Type your answer…"
              />
            </li>
          ))}
        </ol>

        <Button
          className="mt-12 w-full sm:w-auto"
          size="lg"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </main>
    </div>
  );
}
