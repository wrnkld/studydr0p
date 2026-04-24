import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { toast } from "sonner";
import { CardSortConfig, StudyStatus, StudyType, SurveyConfig } from "@/lib/types";
import SurveyBuilder from "./builders/SurveyBuilder";
import CardSortBuilder from "./builders/CardSortBuilder";

interface StudyRow {
  id: string;
  title: string;
  description: string | null;
  type: StudyType;
  status: StudyStatus;
  slug: string | null;
  config: unknown;
}

export default function StudyBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState<StudyRow | null>(null);

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
        navigate("/studies");
        return;
      }
      setStudy(data as StudyRow);
      setLoading(false);
    })();
  }, [id, navigate]);

  if (loading || !study) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container py-10 text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (study.type === "survey") {
    const cfg = (study.config as SurveyConfig) ?? { questions: [], layout: "single_page" };
    return (
      <SurveyBuilder
        studyId={study.id}
        initial={{
          title: study.title,
          description: study.description,
          status: study.status,
          slug: study.slug,
          config: cfg,
        }}
      />
    );
  }

  if (study.type === "card_sort") {
    const cfg = (study.config as CardSortConfig) ?? { sort_type: "open" };
    return (
      <CardSortBuilder
        studyId={study.id}
        initial={{
          title: study.title,
          description: study.description,
          status: study.status,
          slug: study.slug,
          config: cfg,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container py-10 text-sm text-muted-foreground">
        This study type is not supported yet.
      </div>
    </div>
  );
}
