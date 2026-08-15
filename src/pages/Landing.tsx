import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePaid } from "@/hooks/usePaid";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { PageContainer } from "@/components/study/primitives";
import AuthDialog from "@/components/AuthDialog";
import { toast } from "sonner";
import illoFridgeAsset from "@/assets/illo-fridge.svg.asset.json";
import illoGasStationAsset from "@/assets/illo-gasstation.svg.asset.json";
import illoGroceryAsset from "@/assets/illo-grocery.svg.asset.json";
import illoOrderAgainAsset from "@/assets/illo-orderagain.svg.asset.json";
const illoFridge = illoFridgeAsset.url;
const illoGasStation = illoGasStationAsset.url;
const illoGrocery = illoGroceryAsset.url;
const illoOrderAgain = illoOrderAgainAsset.url;
import illoWhyShareAsset from "@/assets/illo-why-share.svg.asset.json";
const illoWhyShare = illoWhyShareAsset.url;



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

const EXAMPLE_ROWS: (CombinedRow & { illo: string; description: string })[] = [
  {
    id: "fridge",
    href: "/examples/fridge",
    title: "Where does it go in the fridge?",
    type: "card_sort",
    slug: null,
    responseCount: 20,
    isExample: true,
    illo: illoFridge,
    description: "Put each item in the fridge.",
  },
  {
    id: "gasstation",
    href: "/examples/gasstation",
    title: "Gas station food. No judgment.",
    type: "survey",
    slug: null,
    responseCount: 20,
    isExample: true,
    illo: illoGasStation,
    description: "Rate the snacks you'd actually buy.",
  },
  {
    id: "grocery",
    href: "/examples/grocery",
    title: "Help us stock the shelves.",
    type: "tree_test",
    slug: null,
    responseCount: 20,
    isExample: true,
    illo: illoGrocery,
    description: "Sort each product into its department.",
  },
  {
    id: "orderitagain",
    href: "/examples/orderitagain",
    title: "Order it again.",
    type: "first_click",
    slug: null,
    responseCount: 20,
    isExample: true,
    illo: illoOrderAgain,
    description: "Click the first place you'd look to reorder.",
  },
];

export default function Landing() {
  const { user, loading: authLoading } = useAuth();
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

  // --- Signed-out: example cards (matches NewStudy card style) ---
  const renderRow = (r: CombinedRow & { illo?: string; description?: string }) => {
    return (
      <a
        key={`${r.isExample ? "ex" : "us"}-${r.id}`}
        href={r.href}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          navigate(r.href);
        }}
        onAuxClick={(e) => {
          if (e.button === 1) {
            e.preventDefault();
            window.open(r.href, "_blank", "noopener");
          }
        }}
        aria-label={`${STUDY_TYPE_META[r.type]?.label ?? r.type}: ${r.title}`}
        className="group relative flex w-full flex-col items-center rounded-lg border border-border bg-card text-center no-underline overflow-hidden transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ padding: "32px 32px 28px" }}
      >
        <div className="mb-4">
          <span
            className="inline-block rounded-full border border-border bg-background px-2.5 py-1 font-mono uppercase text-muted-foreground text-[11px]"
            style={{ letterSpacing: "0.12em" }}
          >
            {STUDY_TYPE_META[r.type]?.label ?? r.type}
          </span>
        </div>

        {r.illo ? (
          <div className="mb-6" aria-hidden>
            <img
              src={r.illo}
              alt=""
              loading="eager" decoding="async" fetchPriority="high"
              width={240}
              height={240}
              className="block h-[240px] w-[240px]"
            />
          </div>
        ) : null}

        <div className="min-w-0">
          <h3
            className="font-serif text-2xl font-bold text-foreground"
            style={{ lineHeight: 1.15, letterSpacing: "-0.015em" }}
          >
            {r.title}
          </h3>
          {r.description ? (
            <p className="mt-2 text-base text-muted-foreground leading-relaxed">
              {r.description}
            </p>
          ) : null}
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
        className="group cursor-pointer transition-colors hover:bg-muted/50"
      >
        <td className="py-3 px-3 sm:px-5">
          <div className="flex items-center gap-3 min-w-0">
              <span className="font-serif font-medium text-base tracking-tight truncate text-foreground">
              {r.title}
            </span>
          </div>
        </td>
        <td className="hidden sm:table-cell py-3 px-5">
          <span
            className="inline-block rounded-full border border-border bg-background px-2.5 py-1 font-mono uppercase text-muted-foreground text-[11px]"
            style={{ letterSpacing: "0.12em" }}
          >
            {typeLabel}
          </span>
        </td>
        <td className="hidden sm:table-cell py-3 px-5">
          {r.isExample ? (
            <span
              className="inline-block rounded-full border border-border bg-background px-2 py-0.5 font-mono uppercase text-muted-foreground text-[11px]"
              style={{ letterSpacing: "0.12em" }}
            >
              Example
            </span>
          ) : (
            <span className="inline-block" style={{ width: "54px" }} aria-hidden />
          )}
        </td>
        <td className="hidden sm:table-cell py-3 px-5 font-mono tabular-nums text-muted-foreground text-right whitespace-nowrap text-[11px]">
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
        className={`inline-flex items-center gap-1.5 font-mono uppercase text-muted-foreground hover:text-foreground transition-colors text-[11px] ${align === "right" ? "flex-row-reverse" : ""}`}
        style={{ letterSpacing: "0.12em", fontWeight: 500 }}
      >
        {label}
        <Icon className="w-3 h-3" strokeWidth={1.5} style={{ opacity: active ? 1 : 0.4 }} />
      </button>
    );
  };


  const SectionDivider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-4 w-full">
      <div className="h-px flex-1 bg-border" />
      <span
        className="inline-block rounded-full border border-border bg-background px-3 py-1 font-mono uppercase text-muted-foreground whitespace-nowrap text-[11px]"
        style={{ letterSpacing: "0.14em" }}
      >
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );

  return (
    <PageContainer width="wide" space="lg">
      <header className="space-y-3 pt-2 pb-4 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.05] font-serif text-foreground max-w-3xl mx-auto">
          UX research, without the friction.
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Run and share unmoderated UX studies with a single link.
        </p>
      </header>

      {authLoading ? null : user ? (
        loadedUserRows ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-left">
            <thead className="bg-card">
              <tr className="border-b border-border">
                <th className="py-3 px-3 sm:px-5 text-left">
                  <SortHeader label="Study" k="title" />
                </th>
                <th className="hidden sm:table-cell py-3 px-5 text-left">
                  <SortHeader label="Type" k="type" />
                </th>
                <th className="hidden sm:table-cell py-3 px-5" />
                <th className="hidden sm:table-cell py-3 px-5 text-right">
                  <SortHeader label="Responses" k="responses" align="right" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">{rows.map(renderTableRow)}</tbody>
          </table>
        </section>
        ) : null
      ) : (
        <>
          <section>
            <div className="mb-8">
              <SectionDivider label="Examples" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {EXAMPLE_ROWS.map(renderRow)}
            </div>
          </section>

          {/* Why StudyDrop — 50/50 split with connected numbers */}
          <section className="pt-20 pb-10">
            <div className="mb-10">
              <SectionDivider label="Why StudyDrop" />
            </div>
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
              <div className="w-full md:w-1/2 flex justify-center">
                <img
                  src={illoWhyShare}
                  alt=""
                  loading="eager" decoding="async" fetchPriority="high"
                  width={280}
                  height={280}
                  className="block w-full max-w-[280px]"
                />
              </div>
              <div className="w-full md:w-1/2">
                <ol className="relative space-y-8">
                  {[
                    {
                      title: "Build",
                      body: "Create a card sort, tree test, first-click test, or survey.",
                    },
                    {
                      title: "Share",
                      body: "Copy the link and send it anywhere.",
                    },
                    {
                      title: "Collect",
                      body: "Participants answer without signing in.",
                    },
                  ].map((item, i, arr) => (
                    <li key={i} className="relative flex gap-5">
                      {i < arr.length - 1 ? (
                        <span
                          className="absolute left-3.5 top-7 -bottom-8 w-px bg-border"
                          aria-hidden
                        />
                      ) : null}
                      <span
                        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background font-mono text-foreground text-[11px]"
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3
                          className="font-serif text-foreground text-2xl font-bold"
                          style={{ lineHeight: 1.2, letterSpacing: "-0.015em" }}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1 text-base text-muted-foreground leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>


          {/* FAQ — wrapped in bordered cards like examples */}
          <section className="pt-20 pb-24">
            <div className="mb-10">
              <SectionDivider label="Questions" />
            </div>
            <FaqList />
          </section>

          {/* Final CTA — calm closing */}
          <section className="pt-16 pb-28">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-serif text-foreground text-3xl sm:text-4xl font-bold tracking-tight leading-[1.05]">
                $75 for lifetime access.
              </h2>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                One payment for unlimited studies and participant responses.
              </p>
              <button
                type="button"
                onClick={handleBadgeClick}
                disabled={isPaid || unlocking}
                className="mt-10 inline-flex h-11 px-7 items-center justify-center rounded-full bg-foreground text-background font-mono uppercase text-xs transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-default disabled:hover:scale-100"
                style={{ letterSpacing: "0.12em" }}
              >
                {unlocking ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                ) : isPaid ? (
                  "You're in — Lifetime"
                ) : (
                  "Get lifetime access"
                )}
              </button>
            </div>
          </section>
        </>
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

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is StudyDrop?",
    a: "StudyDrop is an unmoderated UX research tool for card sorts, tree tests, first-click tests, and surveys.",
  },
  {
    q: "Do participants need an account?",
    a: "No. They open the link and complete the study in their browser.",
  },
  {
    q: "What does it cost?",
    a: "$75 once, including unlimited studies and responses.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. Build studies and collect responses for free, then pay to view the results.",
  },
  {
    q: "How do I share a study?",
    a: "Copy the study link and send it anywhere.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your studies and responses are private to your account, and you can delete them at any time.",
  },
];

function FaqList() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <ol className="flex flex-col rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIdx === i;
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              className="group flex w-full items-start gap-5 px-6 py-6 text-left transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              aria-expanded={open}
            >
              <span
                className="font-mono text-muted-foreground shrink-0 pt-1 text-[11px]"
                style={{ letterSpacing: "0.08em" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className="font-serif text-foreground block text-2xl font-bold"
                  style={{ lineHeight: 1.2, letterSpacing: "-0.015em" }}
                >
                  {item.q}
                </span>
                <div className={`faq-answer-grid ${open ? "open" : ""}`}>
                  <span className="faq-answer-inner block mt-3 text-base text-muted-foreground leading-relaxed">
                    {item.a}
                  </span>
                </div>
              </span>
              <span
                className="shrink-0 pt-2 text-muted-foreground font-mono select-none text-base"
                style={{ lineHeight: 1 }}
                aria-hidden
              >
                {open ? "×" : "+"}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}



