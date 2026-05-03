import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [loadKey, setLoadKey] = useState(0);
  const { actions, setRequestDelete } = useStudyToolbar();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingResponse, setPendingResponse] = useState(false);

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
      setLoadKey((k) => k + 1);
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
  }, [study]);

  useEffect(() => {
    if (!study) return;
    setMeta({
      title: liveTitle.trim() || "Untitled study",
      status: study.status,
      shareUrl,
    });
    return () => setMeta(null);
  }, [study?.id, study?.status, liveTitle, shareUrl, setMeta]);

  const tabsNode = study ? (
    <>
      <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1 mb-4">
        {(["build", "preview", "results"] as TabKey[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all",
              activeTab === t
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {{ build: "Build", preview: "Preview", results: "Responses" }[t]}
          </button>
        ))}
      </div>
    </>
  ) : null;

  const onMetaChange = (meta: { title: string; description: string }) => {
    setLiveTitle(meta.title);
    setLiveDescription(meta.description);
  };

  if (loading || !study) {
    return (
      <PageContainer width="wide">
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </PageContainer>
    );
  }

  const builder =
    study.type === "survey" ? (
      <SurveyBuilder
        key={loadKey}
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
        key={loadKey}
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
    <PageContainer width="wide">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setTab(v as TabKey)}
      >
        {tabsNode}
        <PageHeader
          title={liveTitle.trim() || "Untitled study"}
          description={liveDescription.trim() || undefined}
        />

        <div className="mt-6">
          <TabsContent value="build" className="mt-0 space-y-6">
            {builder}
            <div className="flex justify-start pt-2">
              <Button
                disabled={!actions || actions.saving}
                onClick={async () => {
                  await actions?.onSave();
                  setTab("preview");
                }}
              >
                {actions?.saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <InlinePreview
              study={study}
              onSubmitted={() => {
                toast.success("Thank you");
                setPendingResponse(true);
                setTab("results");
              }}
            />
          </TabsContent>
          <TabsContent
            value="results"
            forceMount
            className="mt-0 data-[state=inactive]:hidden"
          >
            <StudyResultsView studyId={study.id} pendingResponse={pendingResponse} onResponsesLoaded={() => setPendingResponse(false)} />
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

function StatusBadge({ status }: { status: StudyStatus }) {
  if (status === "live") {
    return <Badge variant="outline">Live</Badge>;
  }
  if (status === "draft") {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Draft
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Closed
    </Badge>
  );
}

function InlinePreview({
  study,
  onSubmitted,
}: {
  study: StudyRow;
  onSubmitted: () => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [creating, setCreating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCreating(true);
      const ua = navigator.userAgent;
      const isMobile = /Mobi|Android|iPhone/.test(ua);
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          study_id: study.id,
          metadata: { device: isMobile ? "mobile" : "desktop", ua, source: "builder_preview" },
        })
        .select("id")
        .single();
      if (cancelled) return;
      if (error || !data) {
        toast.error(error?.message ?? "Could not start preview session");
        setCreating(false);
        return;
      }
      setSessionId(data.id);
      setStartedAt(Date.now());
      setCreating(false);
    })();
    return () => {
      cancelled = true;
    };
    // Re-create a fresh session each time the study id changes.
  }, [study.id]);

  if (creating || !sessionId) {
    return <div className="flex items-center justify-center py-16"><p className="text-sm text-muted-foreground">Loading preview…</p></div>;
  }

  if (study.type === "survey") {
    const cfg = (study.config as SurveyConfig) ?? { questions: [] };
    if (!cfg.questions || cfg.questions.length === 0) {
      return (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">
            No questions yet — add some in the Build tab.
          </p>
        </div>
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
        sessionId={sessionId}
        startedAt={startedAt}
        preview
        onDone={onSubmitted}
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
        sessionId={sessionId}
        startedAt={startedAt}
        preview
        onDone={onSubmitted}
      />
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-muted-foreground">
        This study type can't be previewed yet.
      </p>
    </div>
  );
}

