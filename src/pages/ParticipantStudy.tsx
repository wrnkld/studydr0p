import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { CardSortConfig, FirstClickConfig, StudyType, SurveyConfig, TreeTestConfig } from "@/lib/types";
import { toast } from "sonner";
import SurveyParticipant from "./participant/SurveyParticipant";
import CardSortParticipant from "./participant/CardSortParticipant";
import TreeTestParticipant from "./participant/TreeTestParticipant";
import FirstClickParticipant from "./participant/FirstClickParticipant";
import { ParticipantShell } from "@/components/study/ParticipantShell";

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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [done, setDone] = useState(false);
  useDocumentTitle(study?.title ?? "Study");

  // Load the study.
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
      setStudy(data as StudyData);
      setLoading(false);
    })();
  }, [slug, isPreview]);

  // Auto-start the session as soon as the study is loaded — no welcome screen.
  // The participant link drops people directly into the study, just like the
  // Preview tab in the builder. One UI for both.
  useEffect(() => {
    if (!study || sessionId) return;
    let cancelled = false;
    (async () => {
      if (isPreview) {
        if (cancelled) return;
        setSessionId("preview");
        setStartedAt(Date.now());
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
      if (cancelled) return;
      if (e || !data) {
        toast.error("Could not start session");
        return;
      }
      setSessionId(data.id);
      setStartedAt(Date.now());
    })();
    return () => {
      cancelled = true;
    };
  }, [study, sessionId, isPreview]);

  if (loading) {
    return (
      <main className="container py-8">
        <ParticipantShell title="Loading…">
          <p className="text-sm text-muted-foreground">One moment.</p>
        </ParticipantShell>
      </main>
    );
  }

  if (error === "not_found") {
    return (
      <main className="container py-8">
        <ParticipantShell title="Study not found">
          <p className="text-muted-foreground">This link doesn't lead anywhere.</p>
        </ParticipantShell>
      </main>
    );
  }

  if (error === "closed") {
    return (
      <main className="container py-8">
        <ParticipantShell title="This study is closed">
          <p className="text-muted-foreground">
            Thanks for your interest — the researcher is no longer collecting responses.
          </p>
        </ParticipantShell>
      </main>
    );
  }

  if (!study) return null;

  if (done) {
    return (
      <main className="container py-8">
        <ParticipantShell title="Thank you">
          <p className="text-muted-foreground">
            {isPreview
              ? "Preview complete — nothing was saved."
              : "Your response has been recorded."}
          </p>
        </ParticipantShell>
      </main>
    );
  }

  if (!sessionId) return null;

  let body: React.ReactNode = null;
  if (study.type === "survey") {
    const cfg = (study.config as SurveyConfig) ?? { questions: [] };
    body = (
      <SurveyParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        preview={isPreview}
        onDone={() => setDone(true)}
      />
    );
  } else if (study.type === "card_sort") {
    const cfg = (study.config as CardSortConfig) ?? { sort_type: "open" };
    body = (
      <CardSortParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        preview={isPreview}
        onDone={() => setDone(true)}
      />
    );
  } else if (study.type === "tree_test") {
    const cfg = (study.config as TreeTestConfig) ?? { tasks: [] };
    body = (
      <TreeTestParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        onDone={() => setDone(true)}
      />
    );
  } else if (study.type === "first_click") {
    const cfg = (study.config as FirstClickConfig) ?? {
      task: "",
      image_url: "",
      correct_zone: null,
    };
    body = (
      <FirstClickParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        preview={isPreview}
        onDone={() => setDone(true)}
      />
    );
  } else {
    body = <p className="text-sm text-muted-foreground">Unsupported study type.</p>;
  }

  return (
    <main className="container py-8">
      <ParticipantShell title={study.title} description={study.description}>
        {body}
      </ParticipantShell>
    </main>
  );
}
