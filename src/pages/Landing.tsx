import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { StudyTypeIcon } from "@/lib/studyTypeIcons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { PageContainer, PageHeader } from "@/components/study/primitives";

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
  {
    id: "grocery",
    href: "/examples/grocery",
    title: "Help us stock the shelves.",
    type: "tree_test",
    responseCount: 20,
    isExample: true,
  },
  {
    id: "orderitagain",
    href: "/examples/orderitagain",
    title: "Order it again.",
    type: "first_click",
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
  const totalResponses = rows.reduce((sum, r) => sum + (r.responseCount || 0), 0);

  return (
    <PageContainer width="wide" space="lg">
    <PageHeader
        title="UX research, without the friction."
        description="Run and share unmoderated UX studies with a single link."
      />

      {(
        <section className="rounded-lg border border-border/70 bg-card divide-y divide-border/60 shadow-[0_1px_2px_rgba(20,20,15,0.04)] overflow-hidden">
          {rows.map((r) => {
            const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
            return (
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
                className="group grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_6rem_6rem] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-muted/40 cursor-pointer"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background"
                      aria-label={typeLabel}
                    >
                      <StudyTypeIcon type={r.type} size={24} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">{typeLabel}</TooltipContent>
                </Tooltip>

                <div className="min-w-0 text-[15px] font-medium tracking-tight text-foreground truncate font-serif">
                  {r.title}
                </div>

                <div className="hidden sm:flex">
                  {r.isExample ? (
                    <Badge variant="secondary">Example</Badge>
                  ) : r.status === "live" ? (
                    <Badge variant="outline">Live</Badge>
                  ) : r.status === "draft" ? (
                    <Badge variant="outline">Draft</Badge>
                  ) : r.status === "closed" ? (
                    <Badge variant="secondary">Closed</Badge>
                  ) : null}
                </div>

                <div className="hidden sm:block text-sm text-muted-foreground tabular-nums text-right whitespace-nowrap">
                  {r.responseCount} {r.responseCount === 1 ? "response" : "responses"}
                </div>
              </div>
            );
          })}
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
