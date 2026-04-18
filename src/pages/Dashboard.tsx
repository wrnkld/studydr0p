import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { STUDY_TYPE_META, StudyType, StudyStatus } from "@/lib/types";
import { FREE_STUDY_LIMIT, FREE_RESPONSE_LIMIT, UPGRADE_COPY } from "@/lib/limits";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface StudyRow {
  id: string;
  title: string;
  type: StudyType;
  status: StudyStatus;
  slug: string | null;
  response_count: number;
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

      if (studiesRes.data) {
        // count responses per study
        const ids = studiesRes.data.map((s) => s.id);
        let counts: Record<string, number> = {};
        if (ids.length) {
          const { data: respData } = await supabase
            .from("responses")
            .select("study_id")
            .in("study_id", ids);
          counts = (respData || []).reduce<Record<string, number>>((acc, r) => {
            acc[r.study_id] = (acc[r.study_id] || 0) + 1;
            return acc;
          }, {});
        }
        setStudies(
          studiesRes.data.map((s) => ({
            ...s,
            response_count: counts[s.id] || 0,
          })) as StudyRow[],
        );
      }
      setLoading(false);
    })();
  }, [user]);

  const atStudyLimit = !isPaid && studies.length >= FREE_STUDY_LIMIT;

  const copyShareLink = (slug: string | null) => {
    if (!slug) return;
    const url = `${window.location.origin}/s/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-5xl py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Studies</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isPaid
                ? "Unlimited plan"
                : `Free plan · ${studies.length}/${FREE_STUDY_LIMIT} studies · ${FREE_RESPONSE_LIMIT} responses per study`}
            </p>
          </div>
          <div className="flex gap-2">
            {!isPaid && (
              <Button variant="outline" onClick={() => toast.info("Payments coming soon")}>
                Upgrade
              </Button>
            )}
            <Button asChild disabled={atStudyLimit}>
              <Link
                to="/dashboard/studies/new"
                onClick={(e) => {
                  if (atStudyLimit) {
                    e.preventDefault();
                    toast.error(
                      `${UPGRADE_COPY.headline}. ${UPGRADE_COPY.body}`,
                    );
                  }
                }}
              >
                New study
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : studies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <div className="font-medium">No studies yet</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first study to get started.
              </p>
              <Button asChild className="mt-6">
                <Link to="/dashboard/studies/new">New study</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {studies.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/dashboard/studies/${s.id}/edit`}
                        className="truncate font-medium hover:underline"
                      >
                        {s.title}
                      </Link>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {STUDY_TYPE_META[s.type].label} · {s.response_count} responses
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {s.status === "live" && s.slug && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyShareLink(s.slug)}
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy link
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/dashboard/studies/${s.id}/results`}>
                        Results
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`/dashboard/studies/${s.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: StudyStatus }) {
  const map: Record<StudyStatus, string> = {
    draft: "bg-muted text-muted-foreground",
    live: "bg-foreground text-background",
    closed: "bg-secondary text-secondary-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {status}
    </span>
  );
}
