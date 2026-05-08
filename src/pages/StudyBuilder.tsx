import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CardSortConfig,
  StudyStatus,
  StudyType,
  SurveyConfig,
  TreeTestConfig,
} from "@/lib/types";
import SurveyBuilder from "./builders/SurveyBuilder";
import CardSortBuilder from "./builders/CardSortBuilder";
import TreeTestBuilder from "./builders/TreeTestBuilder";
import {
  ParticipantExperience,
  ParticipantViewport,
} from "./participant/ParticipantExperience";

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
import { PageContainer, PageHeader } from "@/components/study/primitives";
import { useStudyToolbar } from "@/components/StudyToolbarContext";
import { Button } from "@/components/ui/button";
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

  const ensurePreviewLink = useCallback(async (current: StudyRow) => {
    if (current.slug) return current;
    const nextSlug = current.slug ?? generateSlug();
    const { data, error } = await supabase
      .from("studies")
      .update({ slug: nextSlug })
      .eq("id", current.id)
      .select("id, title, description, type, status, slug, config")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Could not create preview link");
      return current;
    }
    const updated = data as StudyRow;
    setStudy(updated);
    setLiveTitle(updated.title);
    setLiveDescription(updated.description ?? "");
    return updated;
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (actions?.onDelete) {
        await actions.onDelete();
      } else if (id) {
        const { error } = await supabase.from("studies").delete().eq("id", id);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Study deleted");
      }
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
    ) : study.type === "tree_test" ? (
      <TreeTestBuilder
        key={loadKey}
        studyId={study.id}
        onMetaChange={onMetaChange}
        initial={{
          title: study.title,
          description: study.description,
          status: study.status,
          slug: study.slug,
          config: (study.config as TreeTestConfig) ?? { tasks: [] },
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
        {activeTab !== "preview" && (
          <PageHeader
            title={liveTitle.trim() || "Untitled study"}
            description={liveDescription.trim() || undefined}
          />
        )}

        <div className={activeTab === "preview" ? "mt-0" : "mt-6"}>
          <TabsContent value="build" className="mt-0 space-y-6">
            {builder}
            <div className="flex justify-start pt-2">
              <Button
                disabled={!actions || actions.saving}
                onClick={async () => {
                  const result = await actions?.onSave();
                  // If onSave returns false, validation failed — stay on Build tab
                  if (result === false) return;
                  // Re-fetch study to get updated slug/status
                  const { data: updated } = await supabase
                    .from("studies")
                    .select("id, title, description, type, status, slug, config")
                    .eq("id", study.id)
                    .single();
                  if (updated) {
                    setStudy(updated as StudyRow);
                    const url = updated.slug
                      ? `${window.location.origin}/s/${updated.slug}`
                      : null;
                    if (url) {
                      await navigator.clipboard.writeText(url);
                    }
                    toast.success(url ? "Saved and link copied" : "Saved");
                  }
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
              ensurePreviewLink={ensurePreviewLink}
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

function InlinePreview({
  study,
  ensurePreviewLink,
  onSubmitted,
}: {
  study: StudyRow;
  ensurePreviewLink: (study: StudyRow) => Promise<StudyRow>;
  onSubmitted: () => void;
}) {
  const [previewStudy, setPreviewStudy] = useState<StudyRow | null>(null);
  const [creating, setCreating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCreating(true);
      if (cancelled) return;
      const next = await ensurePreviewLink(study);
      if (!cancelled) setPreviewStudy(next);
      setCreating(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [study, ensurePreviewLink]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "studydrop:preview-submitted") return;
      if (event.data.studyId !== study.id) return;
      onSubmitted();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onSubmitted, study.id]);

  if (creating || !previewStudy?.slug) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading preview…</p>
      </div>
    );
  }

  return (
    <iframe
      key={previewStudy.slug}
      title="Study preview"
      src={`/s/${previewStudy.slug}?preview=1`}
      className="h-[760px] w-full border-0 bg-background"
    />
  );
}

