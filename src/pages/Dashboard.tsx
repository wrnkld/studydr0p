import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { StudyType } from "@/lib/types";
import { FREE_STUDY_LIMIT, UPGRADE_COPY } from "@/lib/limits";
import { toast } from "sonner";

interface StudyRow {
  id: string;
  title: string;
  type: StudyType;
  slug: string | null;
  responseCount: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [studiesRes, researcherRes] = await Promise.all([
        supabase
          .from("studies")
          .select("id, title, type, slug, responses(count)")
          .eq("researcher_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("researchers")
          .select("is_paid")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (researcherRes.data) setIsPaid(researcherRes.data.is_paid);
      if (studiesRes.data) {
        const rows: StudyRow[] = (studiesRes.data as any[]).map((s) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          slug: s.slug,
          responseCount: s.responses?.[0]?.count ?? 0,
        }));
        setStudies(rows);
      }
      setLoading(false);
    })();
  }, [user]);

  const atStudyLimit = !isPaid && studies.length >= FREE_STUDY_LIMIT;

  return (
    <>
      <AppHeader />
      <main className="p-6 space-y-4">
        <div className="flex justify-end">
          <Link
            to="/studies/new"
            className="underline"
            onClick={(e) => {
              if (atStudyLimit) {
                e.preventDefault();
                toast.error(`${UPGRADE_COPY.headline}. ${UPGRADE_COPY.body}`);
              }
            }}
          >
            New study
          </Link>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : studies.length === 0 ? null : (
          <ul className="space-y-1">
            {studies.map((s) => (
              <li key={s.id}>
                {s.title || "Untitled"} — {s.type.replace("_", "-")} —{" "}
                {s.responseCount} response{s.responseCount === 1 ? "" : "s"} —{" "}
                <Link to={`/studies/${s.id}`} className="underline">
                  view
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
