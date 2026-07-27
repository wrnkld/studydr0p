import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePaid } from "@/hooks/usePaid";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { StudyTypeIcon } from "@/lib/studyTypeIcons";
import { PageContainer } from "@/components/study/primitives";
import AuthDialog from "@/components/AuthDialog";
import { toast } from "sonner";
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

interface CombinedRow {
  id: string;
  href: string;
  title: string;
  type: StudyType;
  slug: string | null;
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
    slug: null,
    responseCount: 20,
    isExample: true,
  },
  {
    id: "gasstation",
    href: "/examples/gasstation",
    title: "Gas station food. No judgment.",
    type: "survey",
    slug: null,
    responseCount: 20,
    isExample: true,
  },
  {
    id: "grocery",
    href: "/examples/grocery",
    title: "Help us stock the shelves.",
    type: "tree_test",
    slug: null,
    responseCount: 20,
    isExample: true,
  },
  {
    id: "orderitagain",
    href: "/examples/orderitagain",
    title: "Order it again.",
    type: "first_click",
    slug: null,
    responseCount: 20,
    isExample: true,
  },
];

// App palette blocks — real chart tokens, not faded pastel washes.
const EXAMPLE_BLOCK_CLASS: Record<StudyType, string> = {
  card_sort: "bg-chart-4 text-foreground",   // yellow
  survey: "bg-chart-3 text-foreground",      // green
  tree_test: "bg-chart-2 text-foreground",   // terracotta
  first_click: "bg-chart-1 text-foreground", // periwinkle
};

const HOVER_ROTATIONS = ["-1.2deg", "1.4deg", "1deg", "-1.6deg", "-0.8deg", "1.2deg"];

// Wacky bento grid placement for the 4 example studies.
// Desktop: 3 cols × 2 rows. Mobile: single column.
const BENTO_CLASSES = [
  "sm:col-span-1 sm:row-span-2",  // tall left
  "sm:col-span-2 sm:row-span-1",  // wide top-right
  "sm:col-span-1 sm:row-span-1",  // small
  "sm:col-span-1 sm:row-span-1",  // small
];

export default function Landing() {
  const { user } = useAuth();
  const { isPaid } = usePaid();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  const [unlocking, setUnlocking] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const resetUnlocking = () => setUnlocking(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") resetUnlocking();
    };

    window.addEventListener("pageshow", resetUnlocking);
    window.addEventListener("focus", resetUnlocking);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", resetUnlocking);
      window.removeEventListener("focus", resetUnlocking);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleBadgeClick = async () => {
    if (isPaid || unlocking) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setUnlocking(true);
    try {
      await (await import("@/lib/startCheckout")).startCheckout({
        userId: user.id,
        email: user.email ?? undefined,
        returnTo: "/",
      });
    } catch {
      setUnlocking(false);
    }
  };
  const [userRows, setUserRows] = useState<CombinedRow[]>([]);
  const [loadedUserRows, setLoadedUserRows] = useState(false);

  const loadStudies = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("studies")
      .select("id, title, type, slug, created_at, responses(count)")
      .eq("researcher_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setUserRows(
        (data as any[]).map((s) => ({
          id: s.id,
          href: `/studies/${s.id}`,
          title: s.title || "Untitled",
          type: s.type as StudyType,
          slug: s.slug as string | null,
          responseCount: s.responses?.[0]?.count ?? 0,
          isExample: false,
          createdAt: s.created_at,
        })),
      );
    }
    setLoadedUserRows(true);
  };

  useEffect(() => {
    if (!user) {
      setUserRows([]);
      setLoadedUserRows(false);
      return;
    }
    loadStudies();
  }, [user]);

  const handleCopyLink = async (e: React.MouseEvent, slug: string | null) => {
    e.stopPropagation();
    if (!slug) return;
    const url = `${window.location.origin}/s/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(slug);
      toast.success("Link copied");
      setTimeout(() => setCopiedId((id) => (id === slug ? null : id)), 1500);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !user) return;
    setDeleting(true);
    const { error } = await supabase
      .from("studies")
      .delete()
      .eq("id", deleteId)
      .eq("researcher_id", user.id);
    setDeleting(false);
    setDeleteId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Study deleted");
    setUserRows((rows) => rows.filter((r) => r.id !== deleteId));
  };

  // --- Signed-out: wacky bento grid with color blocks + illustration slots ---
  const renderCard = (r: CombinedRow, i: number) => {
    const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
    const blockClass = EXAMPLE_BLOCK_CLASS[r.type];
    const hoverRotate = HOVER_ROTATIONS[i % HOVER_ROTATIONS.length];
    const bento = BENTO_CLASSES[i % BENTO_CLASSES.length];
    const isTall = i === 0;
    return (
      <a
        key={`${r.isExample ? "ex" : "us"}-${r.id}`}
        href={r.href}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          navigate(r.href);
        }}
        aria-label={`${typeLabel}: ${r.title}`}
        className={`group relative flex w-full flex-col rounded-[10px] text-left transition-[transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 no-underline overflow-hidden ${blockClass} ${bento}`}
        style={{
          minHeight: isTall ? "480px" : "230px",
          padding: "28px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `rotate(${hoverRotate}) translateY(-2px)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
        }}
      >
        {/* Illustration slot — user will provide art */}
        <div
          className="flex items-center justify-center"
          style={{
            height: isTall ? "260px" : "120px",
            marginBottom: "16px",
          }}
          aria-hidden
        >
          <StudyTypeIcon type={r.type} size={isTall ? 96 : 64} />
        </div>

        <div className="mt-auto">
          <div
            className="font-mono uppercase opacity-70"
            style={{ fontSize: "10px", letterSpacing: "0.14em", marginBottom: "8px" }}
          >
            {typeLabel} · Example
          </div>
          <div
            className="font-serif"
            style={{ fontSize: "26px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.015em" }}
          >
            {r.title}
          </div>
          <div
            className="mt-3 font-mono tabular-nums opacity-70"
            style={{ fontSize: "11px", letterSpacing: "0.02em" }}
          >
            {r.responseCount} responses
          </div>
        </div>
      </a>
    );
  };

  // --- Sorting ---
  type SortKey = "title" | "type" | "responses";
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortValue = (r: CombinedRow, key: SortKey): string | number => {
    if (key === "title") return r.title.toLowerCase();
    if (key === "type") return (STUDY_TYPE_META[r.type]?.label ?? r.type).toLowerCase();
    return r.responseCount;
  };

  // --- Signed-in: dense table ---
  const renderTableRow = (r: CombinedRow) => {
    const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
    return (
      <tr
        key={`${r.isExample ? "ex" : "us"}-${r.id}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) {
            window.open(r.href, "_blank", "noopener");
            return;
          }
          navigate(r.href);
        }}
        onAuxClick={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            window.open(r.href, "_blank", "noopener");
          }
        }}
        className="group cursor-pointer border-b border-border/60 hover:bg-muted/40 transition-colors"
      >
        <td className="py-3 px-3 sm:px-5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-serif font-medium text-[16px] tracking-tight truncate text-foreground">
              {r.title}
            </span>
          </div>
        </td>
        <td className="hidden sm:table-cell py-3 px-5 font-mono text-muted-foreground whitespace-nowrap" style={{ fontSize: "12px", letterSpacing: "0.02em" }}>
          {typeLabel}
        </td>
        <td className="hidden sm:table-cell py-3 px-5">
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
        <td className="hidden sm:table-cell py-3 px-5 font-mono tabular-nums text-muted-foreground text-right whitespace-nowrap" style={{ fontSize: "12px" }}>
          {r.responseCount}
        </td>
      </tr>
    );
  };

  const rows = [...userRows, ...EXAMPLE_ROWS].sort((a, b) => {
    const av = sortValue(a, sortKey);
    const bv = sortValue(b, sortKey);
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const SortHeader = ({ label, k, align }: { label: string; k: SortKey; align?: "right" }) => {
    const active = sortKey === k;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1.5 font-mono uppercase text-muted-foreground hover:text-foreground transition-colors ${align === "right" ? "flex-row-reverse" : ""}`}
        style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}
      >
        {label}
        <Icon className="w-3 h-3" strokeWidth={1.5} style={{ opacity: active ? 1 : 0.4 }} />
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
        <button
          type="button"
          onClick={handleBadgeClick}
          disabled={isPaid || unlocking}
          aria-label={isPaid ? "Paid — lifetime access" : "Unlock for $75 — lifetime"}
          aria-busy={unlocking}
          className="relative z-10 flex items-center justify-center rounded-full border-2 border-dashed border-primary-foreground/70 bg-primary text-primary-foreground select-none shrink-0 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default"
          style={{
            width: "112px",
            height: "112px",
            transform: isPaid ? "rotate(-6deg)" : "rotate(8deg)",
            boxShadow: "0 1px 0 hsl(var(--foreground) / 0.04)",
            cursor: isPaid || unlocking ? "default" : "pointer",
            opacity: unlocking ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (unlocking) return;
            e.currentTarget.style.transform = "rotate(0deg)";
          }}
          onMouseLeave={(e) => {
            if (unlocking) return;
            e.currentTarget.style.transform = isPaid ? "rotate(-6deg)" : "rotate(8deg)";
          }}
        >
          {unlocking ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary-foreground/80" strokeWidth={1.5} />
          ) : isPaid ? (
            <div className="flex flex-col items-center leading-none text-center" style={{ gap: "4px" }}>
              <span className="font-serif font-bold tracking-tight" style={{ fontSize: "24px", letterSpacing: "-0.02em", lineHeight: 1 }}>
                PAID
              </span>
              <span className="font-mono text-primary-foreground/80" style={{ fontSize: "11px", letterSpacing: "0.02em" }}>
                Lifetime
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center leading-none text-center" style={{ gap: "7px" }}>
              <span className="font-serif font-bold tracking-tight" style={{ fontSize: "32px", letterSpacing: "-0.02em", lineHeight: 1 }}>
                $75
              </span>
              <span className="font-mono uppercase text-primary-foreground/80" style={{ fontSize: "11px", letterSpacing: "0.1em" }}>
                Lifetime
              </span>
            </div>
          )}
        </button>

      </header>

      {user ? (
        loadedUserRows ? (
        <section className="rounded-[6px] border border-border bg-card overflow-hidden">

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="py-2.5 px-3 sm:px-5 text-left">
                  <SortHeader label="Study" k="title" />
                </th>
                <th className="hidden sm:table-cell py-2.5 px-5 text-left">
                  <SortHeader label="Type" k="type" />
                </th>
                <th className="hidden sm:table-cell py-2.5 px-5" />
                <th className="hidden sm:table-cell py-2.5 px-5 text-right">
                  <SortHeader label="Responses" k="responses" align="right" />
                </th>
              </tr>
            </thead>
            <tbody>{rows.map(renderTableRow)}</tbody>
          </table>
        </section>
        ) : null
      ) : (
        <section
          className="grid grid-cols-1 sm:grid-cols-3 sm:grid-rows-2 auto-rows-min"
          style={{ gap: "20px", paddingTop: "12px", paddingBottom: "12px" }}
        >
          {EXAMPLE_ROWS.map((r, i) => renderCard(r, i))}
        </section>
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        title="Sign in to unlock"
        description="Create an account or sign in, then complete your $75 lifetime unlock."
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the study and all of its responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-start gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
              ) : null}
              Delete
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </PageContainer>
  );
}
