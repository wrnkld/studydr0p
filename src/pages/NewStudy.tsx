import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
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

    navigate(`/dashboard/studies/${data.id}/edit`);
  };

  useEffect(() => {
    const requestedType = searchParams.get("type");
    if (!user || !requestedType || !isStudyType(requestedType) || creating) return;
    void create(requestedType);
  }, [searchParams, user, creating]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Choose a study type</h1>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {TYPES.map((t) => {
            const meta = STUDY_TYPE_META[t];
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => void create(t)}
                  disabled={creating}
                  className="group block w-full rounded-lg border border-border p-5 text-left transition-colors hover:bg-accent/40 disabled:opacity-60"
                >
                  <div className="font-medium">{meta.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {meta.description}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
