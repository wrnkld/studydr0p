import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { CardSortConfig, StudyType, SurveyConfig, TreeTestConfig } from "@/lib/types";
import { toast } from "sonner";
import SurveyParticipant from "./participant/SurveyParticipant";
import CardSortParticipant from "./participant/CardSortParticipant";
import TreeTestParticipant from "./participant/TreeTestParticipant";
import { ContentPanel } from "@/components/study/primitives";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <ContentPanel size="narrow" className="space-y-4">
        {children}
      </ContentPanel>
    </main>
  );
}

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

  // Auto-start: create session as soon as study loads (no welcome screen)
  useEffect(() => {
    if (!study || started || error) return;
    (async () => {
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android|iPhone/.test(ua);
      const { data, error: e } = await supabase
        .from("sessions")
        .insert({
          study_id: study.id,
          metadata: {
            device: isMobile ? "mobile" : "desktop",
            ua,
            ...(isPreview ? { source: "builder_preview" } : {}),
          },
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
    })();
  }, [study, started, error, isPreview]);

  useEffect(() => {
    if (!done || !isPreview || !study) return;
    window.parent?.postMessage(
      { type: "studydrop:preview-submitted", studyId: study.id },
      window.location.origin,
    );
  }, [done, isPreview, study]);

  if (loading || (!started && study)) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Shell>
    );
  }

  if (error === "not_found") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Study not found</h1>
        <p className="text-muted-foreground">This link doesn't lead anywhere.</p>
      </Shell>
    );
  }

  if (error === "closed") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">This study is closed</h1>
        <p className="text-muted-foreground">
          Thanks for your interest — the researcher is no longer collecting responses.
        </p>
      </Shell>
    );
  }

  if (!study) return null;

  if (done) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Thank you</h1>
        <p className="text-muted-foreground">
          {isPreview
            ? "Preview complete."
            : "Your response has been recorded."}
        </p>
      </Shell>
    );
  }

  if (!sessionId) return null;

  let studyContent: React.ReactNode = null;

  if (study.type === "survey") {
    const cfg = (study.config as SurveyConfig) ?? { questions: [] };
    studyContent = (
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
    studyContent = (
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
    studyContent = (
      <TreeTestParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        onDone={() => setDone(true)}
      />
    );
  } else {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Unsupported study</h1>
      </Shell>
    );
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{study.title}</h1>
          {study.description && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {study.description}
            </p>
          )}
        </div>
        {studyContent}
      </div>
    </main>
  );
}

