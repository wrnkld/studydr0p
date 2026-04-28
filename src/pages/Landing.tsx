import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/study/primitives";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface CombinedRow {
  id: string;
  href: string;
  title: string;
  type: StudyType;
  responseCount: number;
  isExample: boolean;
}

const EXAMPLE_ROWS: CombinedRow[] = [
  {
    id: "fridge",
    href: "/examples/fridge",
    title: "Where does it go in the fridge?",
    type: "card_sort",
    responseCount: 20,
    isExample: true,
  },
  {
    id: "gasstation",
    href: "/examples/gasstation",
    title: "Gas station food. No judgment.",
    type: "survey",
    responseCount: 20,
    isExample: true,
  },
];

export default function Landing() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [userRows, setUserRows] = useState<CombinedRow[]>([]);
  const [loadingStudies, setLoadingStudies] = useState(false);
  const [toDelete, setToDelete] = useState<CombinedRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      setUserRows([]);
      return;
    }
    setLoadingStudies(true);
    (async () => {
      const { data } = await supabase
        .from("studies")
        .select("id, title, type, responses(count)")
        .eq("researcher_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setUserRows(
          (data as any[]).map((s) => ({
            id: s.id,
            href: `/studies/${s.id}`,
            title: s.title || "Untitled",
            type: s.type as StudyType,
            responseCount: s.responses?.[0]?.count ?? 0,
            isExample: false,
          })),
        );
      }
      setLoadingStudies(false);
    })();
  }, [user]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("studies").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUserRows((prev) => prev.filter((r) => r.id !== toDelete.id));
    setToDelete(null);
    toast.success("Study deleted");
  };

  const rows = [...userRows, ...EXAMPLE_ROWS];

  return (
    <PageContainer space="lg">
      <PageHeader
        title="UX research, without the friction."
        description="Run unmoderated UX studies and share them with participants via a single link."
      />

      {session && loadingStudies ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <section className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 shadow-[0_1px_2px_rgba(20,20,15,0.04)] overflow-hidden">
          {rows.map((r) => (
            <div
              key={`${r.isExample ? "ex" : "us"}-${r.id}`}
              role="link"
              tabIndex={0}
              onClick={() => navigate(r.href)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(r.href);
                }
              }}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium tracking-tight text-foreground">
                  {r.title}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="outline">
                    {STUDY_TYPE_META[r.type]?.label ?? r.type}
                  </Badge>
                  {r.isExample && <Badge variant="outline">Example</Badge>}
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-start leading-tight w-20 shrink-0">
                <span className="text-[15px] font-medium tabular-nums">
                  {r.responseCount}
                </span>
                <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/80">
                  {r.responseCount === 1 ? "response" : "responses"}
                </span>
              </div>

            </div>
          ))}
        </section>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{toDelete?.title}” and all of its
              responses. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
