import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType } from "@/lib/types";
import { toast } from "sonner";

const TYPES: { id: StudyType; label: string }[] = [
  { id: "card_sort", label: "Card sort" },
  { id: "survey", label: "Survey" },
];

function isStudyType(value: string): value is StudyType {
  return TYPES.some((t) => t.id === value);
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
    <>

      <main className="p-6 space-y-4">
        <h1>New study</h1>
        <ul className="space-y-1">
          {TYPES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => void create(t.id)}
                disabled={creating}
                className="underline disabled:opacity-50"
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
