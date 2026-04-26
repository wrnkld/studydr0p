import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CardSortConfig, StudyStatus, StudyType, SurveyConfig } from "@/lib/types";
import SurveyBuilder from "./builders/SurveyBuilder";
import CardSortBuilder from "./builders/CardSortBuilder";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StudyResultsView from "@/components/StudyResultsView";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam === "preview" || tabParam === "results" ? tabParam : "build";

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

  const shareUrl = useMemo(
    () => (study?.slug ? `${window.location.origin}/s/${study.slug}` : null),
    [study?.slug],
  );

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    if (next === "build") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  if (loading || !study) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const builder =
    study.type === "survey" ? (
      <SurveyBuilder
        studyId={study.id}
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
        initial={{
          title: study.title,
          description: study.description,
          status: study.status,
          slug: study.slug,
          config: (study.config as CardSortConfig) ?? { sort_type: "open" },
        }}
      />
    ) : (
      <div className="container py-10 text-sm text-muted-foreground">
        This study type is not supported yet.
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl pt-8">
        <Tabs value={activeTab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="preview" disabled={!shareUrl}>
              Preview
            </TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="build" className="mt-0">
            {builder}
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <PreviewTab shareUrl={shareUrl} />
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <div className="py-10">
              <StudyResultsView studyId={study.id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PreviewTab({ shareUrl }: { shareUrl: string | null }) {
  if (!shareUrl) {
    return (
      <div className="py-10 text-sm text-muted-foreground">
        Save the study first to preview it as a participant.
      </div>
    );
  }
  // ?preview=1 tells ParticipantStudy to skip writing sessions/responses,
  // so previewing never pollutes real data.
  const previewUrl = `${shareUrl}?preview=1`;
  return (
    <div className="py-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Exactly what participants see — submissions here aren't saved.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={previewUrl} target="_blank" rel="noreferrer">
            Open in new tab <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <iframe
          src={previewUrl}
          title="Participant preview"
          className="h-[75vh] w-full"
        />
      </div>
    </div>
  );
}
