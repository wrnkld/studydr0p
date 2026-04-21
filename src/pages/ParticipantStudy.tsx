import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CardSortConfig, FirstClickConfig, FiveSecondConfig, StudyType, SurveyConfig, TreeTestConfig } from "@/lib/types";
import { toast } from "sonner";
import SurveyParticipant from "./participant/SurveyParticipant";
import CardSortParticipant from "./participant/CardSortParticipant";
import FiveSecondParticipant from "./participant/FiveSecondParticipant";
import TreeTestParticipant from "./participant/TreeTestParticipant";
import FirstClickParticipant from "./participant/FirstClickParticipant";

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
  const [study, setStudy] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not_found" | "closed" | null>(null);
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
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
      setStudy(data as StudyData);
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

  if (loading) {
    return (
      <Centered>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </Centered>
    );
  }

  if (error === "not_found") {
    return (
      <Centered>
        <h1 className="text-2xl font-semibold">Study not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This link doesn't lead anywhere.
        </p>
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
    const intro = introCopy(study);
    return (
      <div className="min-h-screen bg-background">
        <main className="container max-w-xl py-16">
          <h1 className="text-3xl font-semibold tracking-tight">{study.title}</h1>
          {study.description && (
            <p className="mt-4 whitespace-pre-wrap text-muted-foreground">
              {study.description}
            </p>
          )}
          <p className="mt-8 text-sm text-muted-foreground">{intro}</p>
          <Button size="lg" className="mt-6" onClick={begin}>
            Start
          </Button>
        </main>
      </div>
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
        onDone={() => setDone(true)}
      />
    );
  }

  if (study.type === "five_second") {
    const cfg = (study.config as FiveSecondConfig) ?? {
      image_url: "",
      duration_ms: 5000,
      follow_up: [],
    };
    return (
      <FiveSecondParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        onDone={() => setDone(true)}
      />
    );
  }

  if (study.type === "tree_test") {
    const cfg = (study.config as TreeTestConfig) ?? { task: "", correct_node_id: "" };
    return (
      <TreeTestParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        onDone={() => setDone(true)}
      />
    );
  }

  if (study.type === "first_click") {
    const cfg = (study.config as FirstClickConfig) ?? { task: "", image_url: "" };
    return (
      <FirstClickParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        onDone={() => setDone(true)}
      />
    );
  }

  return (
    <Centered>
      <h1 className="text-2xl font-semibold">Unsupported study</h1>
    </Centered>
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
  if (study.type === "five_second") {
    const n = (study.config as FiveSecondConfig)?.follow_up?.length ?? 0;
    return `5-second image · ${n} follow-up question${n === 1 ? "" : "s"} · Anonymous`;
  }
  if (study.type === "tree_test") {
    const task = (study.config as TreeTestConfig)?.task ?? "";
    return task ? "Find your answer in the menu · Anonymous" : "Anonymous";
  }
  if (study.type === "first_click") {
    return "Click where you'd go first · Anonymous";
  }
  return "Anonymous";
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">{children}</div>
    </div>
  );
}
