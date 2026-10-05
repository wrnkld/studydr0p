import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType, STUDY_TYPE_META } from "@/lib/types";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/study/primitives";
import NewStudyMenu, { STUDY_TYPES } from "@/components/NewStudyMenu";

function isStudyType(value: string): value is StudyType {
  return STUDY_TYPES.includes(value as StudyType);
}

export default function NewStudy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const attemptedType = useRef<string | null>(null);

  const create = async (type: StudyType) => {
    if (!user || creatingRef.current) return;
    creatingRef.current = true;

    setCreating(true);
    const defaultDescription =
      type === "card_sort"
        ? "Sort each item into the group where you think it belongs."
        : type === "survey"
          ? "A few quick questions — should only take a minute."
          : type === "tree_test"
            ? "Navigate the menu to complete each task."
            : type === "first_click"
              ? "Take a look at the screen and click where you'd go first."
              : null;
    const { data, error } = await supabase
      .from("studies")
      .insert({
        researcher_id: user.id,
        title: "Untitled",
        description: defaultDescription,
        type,
        config:
          type === "survey"
            ? { questions: [], layout: "single_page" }
            : type === "card_sort"
              ? { sort_type: "open" }
              : type === "tree_test"
                ? { tasks: [] }
                : type === "first_click"
                  ? { task: "", image_url: "", correct_zone: null }
                  : {},
      })
      .select("id")
      .single();

    creatingRef.current = false;
    setCreating(false);

    if (error || !data) {
      toast.error(error?.message ?? "Failed to create study");
      return;
    }

    navigate(`/studies/${data.id}`);
  };

  useEffect(() => {
    const requestedType = searchParams.get("type");
    if (!user || !requestedType || !isStudyType(requestedType) || attemptedType.current === requestedType) return;
    attemptedType.current = requestedType;
    void create(requestedType);
  }, [searchParams, user]);

  return (
    <PageContainer space="md" width="wide">
      <PageHeader title="New study" />
      <NewStudyMenu disabled={creating} onSelect={type => void create(type)} />
      {creating && <p className="text-base text-muted-foreground">Creating study…</p>}
    </PageContainer>
  );
}
