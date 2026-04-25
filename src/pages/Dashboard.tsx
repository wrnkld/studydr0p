import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { StudyType, StudyStatus } from "@/lib/types";
import { FREE_STUDY_LIMIT, UPGRADE_COPY } from "@/lib/limits";
import { toast } from "sonner";

interface StudyRow {
  id: string;
  title: string;
  type: StudyType;
  status: StudyStatus;
  slug: string | null;
}

const TYPES = [
  { id: "card_sort", label: "Card sort" },
  { id: "survey", label: "Survey" },
] as const;

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
          .select("id, title, type, status, slug")
          .eq("researcher_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("researchers")
          .select("is_paid")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      if (researcherRes.data) setIsPaid(researcherRes.data.is_paid);
      if (studiesRes.data) setStudies(studiesRes.data as StudyRow[]);
      setLoading(false);
    })();
  }, [user]);

  const atStudyLimit = !isPaid && studies.length >= FREE_STUDY_LIMIT;

  return (
    <>
      <AppHeader />
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1>Studies</h1>
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
        ) : studies.length === 0 ? (
          <ul className="space-y-1">
            {TYPES.map((t) => (
              <li key={t.id}>
                <Link to={`/studies/new?type=${t.id}`} className="underline">
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1">
            {studies.map((s) => (
              <li key={s.id}>
                <Link to={`/studies/${s.id}`} className="underline">
                  {s.title || "Untitled"}
                </Link>{" "}
                — {s.type.replace("_", "-")} — {s.status}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
