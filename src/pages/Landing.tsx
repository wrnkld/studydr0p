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

  const EXAMPLE_COLORS: Record<StudyType, string> = {
    card_sort: "#8B8FC4",
    survey: "#8AAD8E",
    tree_test: "#C4A0B4",
    first_click: "#7B8FA0",
    five_second: "#7B8FA0",
  };

  return (
    <PageContainer width="wide" space="lg">
    <PageHeader
        title="UX research, without the friction."
        description="Run and share unmoderated UX studies with a single link."
      />

      {!user ? (
        <section
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: "20px", paddingTop: "12px", paddingBottom: "12px" }}
        >
          {EXAMPLE_ROWS.map((r, i) => {
            const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
            const bg = EXAMPLE_COLORS[r.type];
            // Slight rotation applied on hover for a "physical artifact" feel
            const hoverRotations = ["-1.2deg", "1.4deg", "1deg", "-1.6deg"];
            const hoverRotate = hoverRotations[i % hoverRotations.length];
            return (
              <button
                key={`ex-${r.id}`}
                type="button"
                onClick={() => navigate(r.href)}
                aria-label={`${typeLabel}: ${r.title}`}
                className="group relative flex w-full flex-col rounded-[6px] text-left text-white transition-[transform,box-shadow,filter] duration-200 hover:[filter:brightness(0.94)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                  backgroundColor: bg,
                  height: "240px",
                  padding: "28px",
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `rotate(${hoverRotate}) translateY(-2px)`;
                  e.currentTarget.style.boxShadow =
                    "0 1px 0 rgba(0,0,0,0.04), 0 12px 24px -12px rgba(20,20,15,0.25), 0 24px 48px -24px rgba(20,20,15,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Top row: ticket-style meta */}
                <div className="flex items-start justify-between gap-4">
                  <StudyTypeIcon type={r.type} size={28} className="!text-white" />
                  <div
                    className="text-right text-white"
                    style={{ opacity: 0.85 }}
                  >
                    <div
                      className="font-mono uppercase"
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        opacity: 0.75,
                      }}
                    >
                      Type
                    </div>
                    <div
                      className="font-mono"
                      style={{ fontSize: "12px", letterSpacing: "0.02em" }}
                    >
                      {typeLabel}
                    </div>
                  </div>
                </div>

                {/* Bottom: title + responses with hairline divider */}
                <div className="mt-auto">
                  <div className="flex items-end justify-between gap-4">
                    <div
                      className="font-serif text-white"
                      style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: 1.1,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {r.title}
                    </div>
                    <div
                      className="shrink-0 whitespace-nowrap font-mono tabular-nums text-white"
                      style={{ fontSize: "11px", opacity: 0.75, letterSpacing: "0.02em" }}
                    >
                      {r.responseCount} responses
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      ) : (
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
