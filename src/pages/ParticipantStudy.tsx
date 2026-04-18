import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SurveyConfig, SurveyQuestion } from "@/lib/types";
import { toast } from "sonner";

interface StudyData {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  config: SurveyConfig;
}

export default function ParticipantStudy() {
  const { slug } = useParams();
  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not_found" | "closed" | null>(null);
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error: e } = await supabase
        .from("studies")
        .select("id, title, description, type, status, config")
        .eq("slug", slug)
        .maybeSingle();
      if (e || !data) {
        setError("not_found");
        setLoading(false);
        return;
      }
      if (data.status !== "live") {
        setError("closed");
        setLoading(false);
        return;
      }
      setStudy({
        ...data,
        config: (data.config as unknown as SurveyConfig) ?? { questions: [] },
      });
      setLoading(false);
    })();
  }, [slug]);

  const begin = async () => {
    if (!study) return;
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone/.test(ua);
    const { data, error: e } = await supabase
      .from("sessions")
      .insert({
        study_id: study.id,
        metadata: { device: isMobile ? "mobile" : "desktop", ua },
      })
      .select("id")
      .single();
    if (e || !data) {
      toast.error("Could not start session");
      return;
    }
    setSessionId(data.id);
    setStartedAt(Date.now());
    setStarted(true);
  };

  const submit = async () => {
    if (!study || !sessionId) return;
    const required = study.config.questions;
    for (const q of required) {
      const a = answers[q.id];
      if (a === undefined || a === "" || (Array.isArray(a) && a.length === 0)) {
        toast.error("Please answer all questions");
        return;
      }
    }
    setSubmitting(true);
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
        metadata: {
          duration_ms: Date.now() - startedAt,
        },
      })
      .eq("id", sessionId);
    setSubmitting(false);
    setDone(true);
  };

  if (loading) {
    return <Centered><div className="text-sm text-muted-foreground">Loading…</div></Centered>;
  }

  if (error === "not_found") {
    return (
      <Centered>
        <h1 className="text-2xl font-semibold">Study not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This link doesn't lead anywhere.</p>
      </Centered>
    );
  }

  if (error === "closed") {
    return (
      <Centered>
        <h1 className="text-2xl font-semibold">This study is closed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for your interest — the researcher is no longer collecting responses.
        </p>
      </Centered>
    );
  }

  if (!study) return null;

  if (done) {
    return (
      <Centered>
        <h1 className="text-3xl font-semibold tracking-tight">Thank you</h1>
        <p className="mt-3 text-muted-foreground">Your response has been recorded.</p>
      </Centered>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container max-w-xl py-16">
          <h1 className="text-3xl font-semibold tracking-tight">{study.title}</h1>
          {study.description && (
            <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{study.description}</p>
          )}
          <p className="mt-8 text-sm text-muted-foreground">
            {study.config.questions.length} question{study.config.questions.length === 1 ? "" : "s"} · Anonymous
          </p>
          <Button size="lg" className="mt-6" onClick={begin}>Start</Button>
        </main>
      </div>
    );
  }

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
  // multiple_choice
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">{children}</div>
    </div>
  );
}
