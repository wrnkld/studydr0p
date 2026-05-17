import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { StudyTypeIcon } from "@/lib/studyTypeIcons";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/study/primitives";

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

  // Type-mapped colors for the canned examples.
  const EXAMPLE_COLORS: Record<StudyType, string> = {
    card_sort: "#777BBB",
    survey: "#9AA67E",
    tree_test: "#B87D6A",
    first_click: "#4E7A8A",
  };

  // Full palette — user-created studies cycle through this in creation order.
  const PALETTE = [
    "#777BBB", // indigo (matches primary)
    "#9AA67E", // sage
    "#B87D6A", // terra
    "#4E7A8A", // teal
    "#C4A882", // ochre
    "#8B6B8A", // mauve
    "#6B8A8A", // slate
    "#A87A5E", // clay
  ];

  const HOVER_ROTATIONS = ["-1.2deg", "1.4deg", "1deg", "-1.6deg", "-0.8deg", "1.2deg"];

  const renderCard = (r: CombinedRow, i: number) => {
    const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
    const bg = r.isExample
      ? EXAMPLE_COLORS[r.type]
      : PALETTE[(i + 4) % PALETTE.length];
    const hoverRotate = HOVER_ROTATIONS[i % HOVER_ROTATIONS.length];
    const tint = `${bg}33`; // 20% alpha
    return (
      <button
        key={`${r.isExample ? "ex" : "us"}-${r.id}`}
        type="button"
        onClick={() => navigate(r.href)}
        aria-label={`${typeLabel}: ${r.title}`}
        className="group relative flex w-full flex-col rounded-[6px] bg-card text-left text-foreground border border-border transition-[transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{
          height: "240px",
          padding: "28px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `rotate(${hoverRotate}) translateY(-2px)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "9999px",
              backgroundColor: tint,
              color: bg,
            }}
          >
            <StudyTypeIcon type={r.type} size={24} />
          </div>
          <div className="text-right text-muted-foreground">
            <div
                  className="font-mono uppercase"
                  style={{ fontSize: "9px", letterSpacing: "0.12em", opacity: 0.75 }}
                >
                  {r.isExample ? "EXAMPLE" : "TYPE"}
                </div>
            <div
              className="font-mono"
              style={{ fontSize: "12px", letterSpacing: "0.02em" }}
            >
              {typeLabel}
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex items-end justify-between gap-4">
            <div
              className="font-serif text-foreground"
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
              className="shrink-0 whitespace-nowrap font-mono tabular-nums text-muted-foreground"
              style={{ fontSize: "11px", letterSpacing: "0.02em" }}
            >
              {r.responseCount} responses
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <PageContainer width="wide" space="lg">
      <header className="flex flex-row items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight font-serif">
            UX research, without the friction.
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            Run and share unmoderated UX studies with a single link.
          </p>
        </div>
        <div
          aria-label="$75 once, lifetime"
          className="relative z-10 flex items-center justify-center rounded-full border-2 border-dashed border-border text-foreground select-none shrink-0 bg-card transition-transform duration-200"
          style={{
            width: "112px",
            height: "112px",
            transform: "rotate(8deg)",
            boxShadow: "0 1px 0 hsl(var(--foreground) / 0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "rotate(0deg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "rotate(8deg)";
          }}
        >
          <div className="flex flex-col items-center leading-none text-center" style={{ gap: "4px" }}>
            <span
              className="font-serif font-bold"
              style={{ fontSize: "32px", letterSpacing: "-0.03em", lineHeight: 1 }}
            >
              $75
            </span>
            <span
              className="font-mono uppercase text-muted-foreground"
              style={{ fontSize: "9px", letterSpacing: "0.14em" }}
            >
              Lifetime
            </span>
          </div>
        </div>
      </header>

      <section
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ gap: "20px", paddingTop: "12px", paddingBottom: "12px" }}
      >
        {(user ? rows : EXAMPLE_ROWS).map((r, i) => renderCard(r, i))}
      </section>


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
