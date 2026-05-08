import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { StudyType } from "@/lib/types";
import { toast } from "sonner";
import {
  ParticipantExperience,
  ParticipantMessage,
  ParticipantViewport,
} from "./participant/ParticipantExperience";

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
      <ParticipantViewport>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </ParticipantViewport>
    );
  }

  if (error === "not_found") {
    return (
      <ParticipantMessage title="Study not found">
        <p>This link doesn't lead anywhere.</p>
      </ParticipantMessage>
    );
  }

  if (error === "closed") {
    return (
      <ParticipantMessage title="This study is closed">
        <p>
          Thanks for your interest — the researcher is no longer collecting responses.
        </p>
      </ParticipantMessage>
    );
  }

  if (!study) return null;

  if (done) {
    return (
      <ParticipantMessage title="Thank you">
        <p>
          {isPreview
            ? "Preview complete."
            : "Your response has been recorded."}
        </p>
      </ParticipantMessage>
    );
  }

  if (!sessionId) return null;

  return (
    <ParticipantExperience
      study={study}
      sessionId={sessionId}
      startedAt={startedAt}
      preview={isPreview}
      onDone={() => setDone(true)}
    />
  );
}

