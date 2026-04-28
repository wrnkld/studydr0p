import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CardSortConfig,
  StudyStatus,
  StudyType,
  SurveyConfig,
} from "@/lib/types";
import SurveyBuilder from "./builders/SurveyBuilder";
import CardSortBuilder from "./builders/CardSortBuilder";

import StudyResultsView from "@/components/StudyResultsView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SurveyParticipant from "./participant/SurveyParticipant";
import CardSortParticipant from "./participant/CardSortParticipant";
import { PageContainer, PageHeader } from "@/components/study/primitives";
import { useStudyToolbar } from "@/components/StudyToolbarContext";

interface StudyRow {
  id: string;
  title: string;
  description: string | null;
  type: StudyType;
  status: StudyStatus;
  slug: string | null;
  config: unknown;
}

type TabKey = "build" | "preview" | "results";

export default function StudyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState<StudyRow | null>(null);
  const { actions, setRequestDelete } = useStudyToolbar();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam === "preview" || tabParam === "results" ? tabParam : "build";

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    if (next === "build") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("studies")
        .select("id, title, description, type, status, slug, config")
        .eq("id", id)
        .single();
      if (error || !data) {
        toast.error("Study not found");
        navigate("/");
        return;
      }
      setStudy(data as StudyRow);
      setLoading(false);
    })();
  }, [id, navigate]);

  // Re-load study when switching INTO the preview tab so it reflects edits.
  useEffect(() => {
    if (!id || activeTab !== "preview") return;
    (async () => {
      const { data } = await supabase
        .from("studies")
        .select("id, title, description, type, status, slug, config")
        .eq("id", id)
        .single();
      if (data) setStudy(data as StudyRow);
    })();
  }, [id, activeTab]);

  // Route TopBar's Delete button through the confirm dialog.
  useEffect(() => {
    setRequestDelete(() => () => setConfirmDelete(true));
    return () => setRequestDelete(null);
  }, [setRequestDelete]);

  const shareUrl = useMemo(
    () => (study?.slug ? `${window.location.origin}/s/${study.slug}` : null),
    [study?.slug],
  );

  const handleDelete = async () => {
    if (!actions) return;
    setDeleting(true);
    try {
      await actions.onDelete();
      navigate("/", { replace: true });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const [liveTitle, setLiveTitle] = useState("");
  const [liveDescription, setLiveDescription] = useState("");
  const { setMeta } = useStudyToolbar();

  useEffect(() => {
    if (study) {
      setLiveTitle(study.title);
      setLiveDescription(study.description ?? "");
    }
  }, [study?.id]);

  useEffect(() => {
    if (!study) return;
    setMeta({
      title: liveTitle.trim() || "Untitled study",
      status: study.status,
      shareUrl,
    });
    return () => setMeta(null);
  }, [study?.id, study?.status, liveTitle, shareUrl, setMeta]);

  const onMetaChange = (meta: { title: string; description: string }) => {
    setLiveTitle(meta.title);
    setLiveDescription(meta.description);
  };

  if (loading || !study) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </PageContainer>
    );
  }

  const builder =
    study.type === "survey" ? (
      <SurveyBuilder
        studyId={study.id}
        onMetaChange={onMetaChange}
        initial={{
          title: study.title,
          description: study.description,
          status: study.status,
          slug: study.slug,
          config: (study.config as SurveyConfig) ?? {
            questions: [],
            layout: "single_page",
          },
        }}
      />
    ) : study.type === "card_sort" ? (
      <CardSortBuilder
        studyId={study.id}
        onMetaChange={onMetaChange}
        initial={{
          title: study.title,
          description: study.description,
          status: study.status,
          slug: study.slug,
          config: (study.config as CardSortConfig) ?? { sort_type: "open" },
        }}
      />
    ) : (
      <p className="text-sm text-muted-foreground">
        This study type is not supported yet.
      </p>
    );

  return (
    <PageContainer>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setTab(v as TabKey)}
        orientation="vertical"
        className="flex gap-8"
      >
        <TabsList className="flex h-auto w-40 shrink-0 flex-col items-stretch justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="build"
            className="justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            Build
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            Preview
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="justify-start rounded-md px-3 py-2 data-[state=active]:bg-muted data-[state=active]:shadow-none"
          >
            Results
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1 space-y-6">
          <PageHeader
            title={liveTitle.trim() || "Untitled study"}
            description={liveDescription.trim() || undefined}
          />

          <TabsContent value="build" className="mt-0">
            {builder}
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <InlinePreview study={study} shareUrl={shareUrl} />
          </TabsContent>
          <TabsContent value="results" className="mt-0">
            <StudyResultsView studyId={study.id} />
          </TabsContent>
        </div>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the study and all of its responses. This
              action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function InlinePreview({
  study,
}: {
  study: StudyRow;
  shareUrl: string | null;
}) {
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  // Reset preview state if the study changes (e.g. edit + return).
  useEffect(() => {
    setStarted(false);
    setDone(false);
  }, [study.id, study.config, study.title]);

  return (
    <div className="py-2">
      <PreviewBody
        study={study}
        started={started}
        done={done}
        onStart={() => setStarted(true)}
        onDone={() => setDone(true)}
        onRestart={() => {
          setDone(false);
          setStarted(false);
        }}
      />
    </div>
  );
}

function PreviewBody({
  study,
  started,
  done,
  onStart,
  onDone,
  onRestart,
}: {
  study: StudyRow;
  started: boolean;
  done: boolean;
  onStart: () => void;
  onDone: () => void;
  onRestart: () => void;
}) {
  if (done) {
    return (
      <div className="space-y-3 py-6 text-center">
        <h2 className="text-lg font-medium">Thank you</h2>
        <p className="text-sm text-muted-foreground">
          Preview complete — nothing was saved.
        </p>
        <Button variant="outline" size="sm" onClick={onRestart}>
          Restart preview
        </Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-4 py-2">
        <Button onClick={onStart}>Start</Button>
      </div>
    );
  }

  if (study.type === "survey") {
    const cfg = (study.config as SurveyConfig) ?? { questions: [] };
    if (!cfg.questions || cfg.questions.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No questions yet — add some in the Build tab.
        </p>
      );
    }
    return (
      <SurveyParticipant
        study={{
          id: study.id,
          title: study.title,
          description: study.description,
          config: cfg,
        }}
        sessionId="preview"
        startedAt={Date.now()}
        preview
        onDone={onDone}
      />
    );
  }

  if (study.type === "card_sort") {
    const cfg = (study.config as CardSortConfig) ?? { sort_type: "open" };
    return (
      <CardSortParticipant
        study={{
          id: study.id,
          title: study.title,
          description: study.description,
          config: cfg,
        }}
        sessionId="preview"
        startedAt={Date.now()}
        preview
        onDone={onDone}
      />
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      This study type can't be previewed yet.
    </p>
  );
}

