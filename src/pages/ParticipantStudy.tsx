import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CardSortConfig, StudyType, SurveyConfig } from "@/lib/types";
import { toast } from "sonner";
import SurveyParticipant from "./participant/SurveyParticipant";
import CardSortParticipant from "./participant/CardSortParticipant";

interface StudyData {
  id: string;
  title: string;
  description: string | null;
  type: StudyType;
  status: string;
  config: unknown;
}

export default function ParticipantStudy() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "1";
  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not_found" | "closed" | null>(null);
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  useDocumentTitle(study?.title ?? "Study");

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
      if (data.status !== "live" && !isPreview) {
        setError("closed");
        setLoading(false);
        return;
      }
      setStudy(data as StudyData);
      setLoading(false);
    })();
  }, [slug]);

  const begin = async () => {
    if (!study) return;
    if (isPreview) {
      setSessionId("preview");
      setStartedAt(Date.now());
      setStarted(true);
      return;
    }
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

  if (loading) {
    return (
      <main className="container py-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (error === "not_found") {
    return (
      <main className="container py-16 space-y-2">
        <h1>Study not found</h1>
        <p className="text-muted-foreground">This link doesn't lead anywhere.</p>
      </main>
    );
  }

  if (error === "closed") {
    return (
      <main className="container py-16 space-y-2">
        <h1>This study is closed</h1>
        <p className="text-muted-foreground">
          Thanks for your interest — the researcher is no longer collecting responses.
        </p>
      </main>
    );
  }

  if (!study) return null;

  if (done) {
    return (
      <main className="container py-16 space-y-2">
        <h1>Thank you</h1>
        <p className="text-muted-foreground">
          {isPreview
            ? "Preview complete — nothing was saved."
            : "Your response has been recorded."}
        </p>
      </main>
    );
  }

  if (!started) {
    const intro = introCopy(study);
    return (
      <main className="container py-12 space-y-4">
        <h1>{study.title}</h1>
        {study.description && (
          <p className="whitespace-pre-wrap text-muted-foreground">
            {study.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground">{intro}</p>
        <Button onClick={begin}>Start</Button>
      </main>
    );
  }

  if (!sessionId) return null;

  if (study.type === "survey") {
    const cfg = (study.config as SurveyConfig) ?? { questions: [] };
    return (
      <SurveyParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        preview={isPreview}
        onDone={() => setDone(true)}
      />
    );
  }

  if (study.type === "card_sort") {
    const cfg = (study.config as CardSortConfig) ?? { sort_type: "open" };
    return (
      <CardSortParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        preview={isPreview}
        onDone={() => setDone(true)}
      />
    );
  }

  return (
    <main className="container py-16">
      <h1>Unsupported study</h1>
    </main>
  );
}

function introCopy(study: StudyData): string {
  if (study.type === "survey") {
    const n = (study.config as SurveyConfig)?.questions?.length ?? 0;
    return `${n} question${n === 1 ? "" : "s"} · Anonymous`;
  }
  if (study.type === "card_sort") {
    const sort = (study.config as CardSortConfig)?.sort_type ?? "open";
    return sort === "open"
      ? "You'll group cards into categories you create · Anonymous"
      : "You'll sort cards into predefined categories · Anonymous";
  }
  return "Anonymous";
}
