import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import StudyTypePicker from "@/components/StudyTypePicker";
import { StudyType } from "@/lib/types";
import { toast } from "sonner";

const TYPES: StudyType[] = [
  "survey",
  "card_sort",
  "first_click",
  "tree_test",
  "five_second",
];

function isStudyType(value: string): value is StudyType {
  return TYPES.includes(value as StudyType);
}

export default function NewStudy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const create = async (type: StudyType) => {
    if (!user || creating) return;

    setCreating(true);
    const { data, error } = await supabase
      .from("studies")
      .insert({
        researcher_id: user.id,
        title: "Untitled",
        type,
        config:
          type === "survey"
            ? { questions: [], layout: "single_page" }
            : type === "card_sort"
              ? { sort_type: "open" }
              : type === "first_click"
                ? { task: "", image_url: "" }
                : type === "tree_test"
                  ? { task: "", correct_node_id: "" }
                  : type === "five_second"
                    ? { image_url: "", duration_ms: 5000, follow_up: [] }
                    : {},
      })
      .select("id")
      .single();

    setCreating(false);

    if (error || !data) {
      toast.error(error?.message ?? "Failed to create study");
      return;
    }

    navigate(`/studies/${data.id}/edit`);
  };

  useEffect(() => {
    const requestedType = searchParams.get("type");
    if (!user || !requestedType || !isStudyType(requestedType) || creating) return;
    void create(requestedType);
  }, [searchParams, user, creating]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-6xl py-16">
        <h1 className="text-5xl font-semibold tracking-tight">New study</h1>
        <div className="mt-14">
          <StudyTypePicker onSelect={(t) => void create(t)} disabled={creating} />
        </div>
      </main>
    </div>
  );
}
