import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { StudyTypeIcon } from "@/lib/studyTypeIcons";
import { PageContainer } from "@/components/study/primitives";
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
  createdAt?: string;
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

const EXAMPLE_COLORS: Record<StudyType, string> = {
  card_sort: "#777BBB",
  survey: "#9AA67E",
  tree_test: "#B87D6A",
  first_click: "#4E7A8A",
};

const PALETTE = [
  "#777BBB", "#9AA67E", "#B87D6A", "#4E7A8A",
  "#C4A882", "#8B6B8A", "#6B8A8A", "#A87A5E",
];

const HOVER_ROTATIONS = ["-1.2deg", "1.4deg", "1deg", "-1.6deg", "-0.8deg", "1.2deg"];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRows, setUserRows] = useState<CombinedRow[]>([]);
  const [toDelete, setToDelete] = useState<CombinedRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      setUserRows([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("studies")
        .select("id, title, type, created_at, responses(count)")
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
            createdAt: s.created_at,
          })),
        );
      }
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

  // --- Signed-out: chunky cards (marketing/onboarding) ---
  const renderCard = (r: CombinedRow, i: number) => {
    const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
    const bg = r.isExample
      ? EXAMPLE_COLORS[r.type]
      : PALETTE[(i + 4) % PALETTE.length];
    const hoverRotate = HOVER_ROTATIONS[i % HOVER_ROTATIONS.length];
    const tint = `${bg}33`;
    return (
      <button
        key={`${r.isExample ? "ex" : "us"}-${r.id}`}
        type="button"
        onClick={() => navigate(r.href)}
        aria-label={`${typeLabel}: ${r.title}`}
        className="group relative flex w-full flex-col rounded-[6px] bg-card text-left text-foreground border border-border transition-[transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ height: "240px", padding: "28px" }}
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
            <div className="font-mono uppercase" style={{ fontSize: "9px", letterSpacing: "0.12em", opacity: 0.75 }}>
              {r.isExample ? "EXAMPLE" : "TYPE"}
            </div>
            <div className="font-mono" style={{ fontSize: "12px", letterSpacing: "0.02em" }}>
              {typeLabel}
            </div>
          </div>
        </div>
        <div className="mt-auto">
          <div className="flex items-end justify-between gap-4">
            <div
              className="font-serif text-foreground"
              style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.01em" }}
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

  // --- Signed-in: dense table ---
  const renderTableRow = (r: CombinedRow) => {
    const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
    const color = EXAMPLE_COLORS[r.type];
    return (
      <tr
        key={`${r.isExample ? "ex" : "us"}-${r.id}`}
        onClick={() => navigate(r.href)}
        className="group cursor-pointer border-b border-border/60 hover:bg-muted/40 transition-colors"
      >
        <td className="py-3 pr-4 pl-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9999px",
                backgroundColor: `${color}33`,
                color,
              }}
            >
              <StudyTypeIcon type={r.type} size={16} />
            </div>
            <span className="font-serif text-[16px] tracking-tight truncate text-foreground">
              {r.title}
            </span>
          </div>
        </td>
        <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap" style={{ fontSize: "12px", letterSpacing: "0.02em" }}>
          {typeLabel}
        </td>
        <td className="py-3 px-4">
          {r.isExample ? (
            <span
              className="inline-block rounded-full border border-border bg-background px-2 py-0.5 font-mono uppercase text-muted-foreground"
              style={{ fontSize: "9px", letterSpacing: "0.12em" }}
            >
              Example
            </span>
          ) : (
            <span className="inline-block" style={{ width: "54px" }} aria-hidden />
          )}
        </td>
        <td className="py-3 px-4 font-mono tabular-nums text-muted-foreground text-right whitespace-nowrap" style={{ fontSize: "12px" }}>
          {r.responseCount}
        </td>
        <td className="py-3 pl-4 pr-2 text-right w-[1%] whitespace-nowrap">
          {!r.isExample ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setToDelete(r);
              }}
              aria-label={`Delete ${r.title}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary hover:text-foreground transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="inline-block h-7 w-7" aria-hidden />
          )}
        </td>
      </tr>
    );
  };

  const rows = [...userRows, ...EXAMPLE_ROWS];

  return (
    <PageContainer width="wide" space="lg">
      <header className="flex flex-row items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight font-serif">
            {user ? "Your studies." : "UX research, without the friction."}
          </h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {user
              ? "Pick up where you left off, or poke around an example."
              : "Run and share unmoderated UX studies with a single link."}
          </p>
        </div>
        {!user && (
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
              <span className="font-serif font-bold" style={{ fontSize: "32px", letterSpacing: "-0.03em", lineHeight: 1 }}>
                $75
              </span>
              <span className="font-mono uppercase text-muted-foreground" style={{ fontSize: "9px", letterSpacing: "0.14em" }}>
                Lifetime
              </span>
            </div>
          </div>
        )}
      </header>

      {user ? (
        <section className="rounded-[6px] border border-border bg-card overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 pr-4 pl-2 font-mono uppercase text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  Study
                </th>
                <th className="py-2.5 px-4 font-mono uppercase text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  Type
                </th>
                <th className="py-2.5 px-4 font-mono uppercase text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  &nbsp;
                </th>
                <th className="py-2.5 px-4 font-mono uppercase text-muted-foreground text-right" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  Responses
                </th>
                <th className="py-2.5 pl-4 pr-2 w-[1%]" />
              </tr>
            </thead>
            <tbody>{rows.map(renderTableRow)}</tbody>
          </table>
        </section>
      ) : (
        <section
          className="grid grid-cols-1 sm:grid-cols-2"
          style={{ gap: "20px", paddingTop: "12px", paddingBottom: "12px" }}
        >
          {EXAMPLE_ROWS.map((r, i) => renderCard(r, i))}
        </section>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{toDelete?.title}" and all of its
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
