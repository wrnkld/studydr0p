import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { StudyType, StudyStatus } from "@/lib/types";
import { FREE_STUDY_LIMIT, UPGRADE_COPY } from "@/lib/limits";
import { toast } from "sonner";
import { loadDraft, clearDraft } from "@/lib/draftStudy";
import { persistDraftToDb } from "@/pages/LocalBuilder";

interface StudyRow {
  id: string;
  title: string;
  type: StudyType;
  status: StudyStatus;
  slug: string | null;
}

// Studies grid per wireframe — placeholder square tiles. Empty state shows
// five empty squares; otherwise one tile per study, click → study detail.
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaid, setIsPaid] = useState(false);

  // Persist localStorage draft after magic-link sign-in.
  useEffect(() => {
    if (!user) return;
    if (searchParams.get("claim") !== "1") return;
    const draft = loadDraft();
    searchParams.delete("claim");
    setSearchParams(searchParams, { replace: true });
    if (!draft) return;
    (async () => {
      try {
        const studyId = await persistDraftToDb(draft, user.id);
        clearDraft();
        toast.success("Study published");
        navigate(`/dashboard/studies/${studyId}`, { replace: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to save draft";
        toast.error(msg);
      }
    })();
  }, [user, searchParams, setSearchParams, navigate]);

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
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-6xl py-16">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-5xl font-semibold tracking-tight">Studies</h1>
          <Button asChild size="lg" className="rounded-full" disabled={atStudyLimit}>
            <Link
              to="/dashboard/studies/new"
              onClick={(e) => {
                if (atStudyLimit) {
                  e.preventDefault();
                  toast.error(`${UPGRADE_COPY.headline}. ${UPGRADE_COPY.body}`);
                }
              }}
            >
              New study
            </Link>
          </Button>
        </div>

        <div className="mt-14">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : studies.length === 0 ? (
            // Empty state — row of placeholder squares
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="aspect-square rounded-2xl border border-border bg-card shadow-sm"
                />
              ))}
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {studies.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/dashboard/studies/${s.id}`}
                    className="group block aspect-square rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/40"
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        {s.status}
                      </div>
                      <div className="line-clamp-3 text-sm font-medium">
                        {s.title || "Untitled"}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
