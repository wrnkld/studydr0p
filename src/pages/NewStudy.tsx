import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { toast } from "sonner";

const ENABLED: StudyType[] = ["survey"]; // others come in next iterations

export default function NewStudy() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const create = async (type: StudyType) => {
    if (!user) return;
    if (!ENABLED.includes(type)) {
      toast.info(`${STUDY_TYPE_META[type].label} coming soon.`);
      return;
    }
    const { data, error } = await supabase
      .from("studies")
      .insert({
        researcher_id: user.id,
        title: `Untitled ${STUDY_TYPE_META[type].label}`,
        type,
        config: type === "survey" ? { questions: [], layout: "single_page" } : {},
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Failed to create study");
      return;
    }
    navigate(`/dashboard/studies/${data.id}/edit`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-10">
        <h1 className="text-3xl font-semibold tracking-tight">
          Choose a study type
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick the type of research you want to run. You can configure it next.
        </p>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {(Object.keys(STUDY_TYPE_META) as StudyType[]).map((t) => {
            const meta = STUDY_TYPE_META[t];
            const enabled = ENABLED.includes(t);
            return (
              <li key={t}>
                <button
                  onClick={() => create(t)}
                  className="group block w-full rounded-lg border border-border p-5 text-left transition-colors hover:bg-accent/40 disabled:opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{meta.label}</div>
                    {!enabled && (
                      <span className="text-xs text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </div>
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
