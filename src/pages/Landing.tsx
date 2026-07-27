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
import illoFridge from "@/assets/illo-fridge.png";
import illoGasStation from "@/assets/illo-gasstation.png";
import illoGrocery from "@/assets/illo-grocery.png";
import illoOrderAgain from "@/assets/illo-orderagain.png";
import illoWhyShare from "@/assets/illo-why-share.png";
import illoWhyFast from "@/assets/illo-why-fast.png";
import illoWhySimple from "@/assets/illo-why-simple.png";
import illoFaq from "@/assets/illo-faq.png";


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

const EXAMPLE_ROWS: (CombinedRow & { illo: string })[] = [
  {
    id: "fridge",
    href: "/examples/fridge",
    title: "Where does it go in the fridge?",
    type: "card_sort",
    slug: null,
    responseCount: 20,
    isExample: true,
    illo: illoFridge,
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
  },
];

// Small accent dot color per study type — one dot of color per row, nothing more.
const ACCENT_CLASS: Record<StudyType, string> = {
  card_sort: "bg-chart-4",   // yellow
  survey: "bg-chart-3",      // green
  tree_test: "bg-chart-6",   // pink
  first_click: "bg-chart-5", // aqua
};




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

  // --- Signed-out: 4 stacked rows, calm neutral cards with B&W illustration ---
  const renderRow = (r: CombinedRow & { illo?: string }) => {
    const typeLabel = STUDY_TYPE_META[r.type]?.label ?? r.type;
    const accent = ACCENT_CLASS[r.type];
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
        className="group relative flex w-full items-center gap-6 rounded-[12px] border border-border bg-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 no-underline overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-foreground/20"
        style={{ padding: "20px 24px" }}
      >
        {r.illo ? (
          <div
            className="shrink-0 flex items-center justify-center"
            style={{ width: "88px", height: "88px" }}
            aria-hidden
          >
            <img
              src={r.illo}
              alt=""
              loading="lazy"
              width={176}
              height={176}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div
            className="font-serif text-foreground"
            style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.015em" }}
          >
            {r.title}
          </div>
          <div
            className="mt-2 flex items-center gap-2 font-mono uppercase text-muted-foreground"
            style={{ fontSize: "10px", letterSpacing: "0.12em" }}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${accent}`} aria-hidden />
            {typeLabel}
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
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight font-serif">
          UX research, without the friction.
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          Run and share unmoderated UX studies with a single link.
        </p>
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
        <>
          <section>
            <div
              className="font-mono uppercase text-muted-foreground mb-5"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Examples
            </div>
            <div className="flex flex-col" style={{ gap: "16px" }}>
              {EXAMPLE_ROWS.map(renderRow)}
            </div>
          </section>

          {/* Why StudyDrop — three-column editorial feature blocks */}
          <section className="pt-16 pb-8 border-t border-border">
            <div
              className="font-mono uppercase text-muted-foreground mb-10"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              Why StudyDrop
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
              {[
                {
                  illo: illoWhyShare,
                  title: "One link.\nNo setup.",
                  body: "Build a study, share a link. No participant accounts, no logins, no plugins. It just opens.",
                },
                {
                  illo: illoWhyFast,
                  title: "Results\nas they arrive.",
                  body: "Every response streams into a live dashboard with the charts and tables you actually want.",
                },
                {
                  illo: illoWhySimple,
                  title: "Pay once.\nUse forever.",
                  body: "$75 for lifetime access. Unlimited studies, unlimited responses. No seats, no tiers, no trial.",
                },
              ].map((f, i) => (
                <div key={i} className="flex flex-col">
                  <div className="mb-6" style={{ height: "140px" }}>
                    <img
                      src={f.illo}
                      alt=""
                      loading="lazy"
                      width={280}
                      height={280}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                  <h3
                    className="font-serif text-foreground whitespace-pre-line"
                    style={{ fontSize: "26px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}
                  >
                    {f.title}
                  </h3>
                  <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ — editorial two-column */}
          <section className="pt-16 pb-20 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-12 md:gap-16">
              <div>
                <div
                  className="font-mono uppercase text-muted-foreground mb-6"
                  style={{ fontSize: "11px", letterSpacing: "0.14em" }}
                >
                  Questions
                </div>
                <h2
                  className="font-serif text-foreground"
                  style={{ fontSize: "64px", fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.03em" }}
                >
                  Common
                  <br />
                  questions.
                </h2>

                <img
                  src={illoFaq}
                  alt=""
                  loading="lazy"
                  width={280}
                  height={280}
                  className="mt-10 w-56 h-auto"
                />
              </div>
              <FaqList />
            </div>
          </section>

          {/* Final CTA — calm closing */}
          <section className="pt-12 pb-24 border-t border-border">
            <div className="max-w-xl mx-auto text-center">
              <h2
                className="font-serif text-foreground"
                style={{ fontSize: "44px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.025em" }}
              >
                $75. Lifetime access.
              </h2>
              <p className="mt-4 text-[15px] text-muted-foreground leading-relaxed">
                One-time payment for unlimited studies and unlimited participant responses.
              </p>
              <button
                type="button"
                onClick={handleBadgeClick}
                disabled={isPaid || unlocking}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-foreground text-background font-mono uppercase tracking-wider transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-default"
                style={{ fontSize: "12px", letterSpacing: "0.14em", padding: "16px 28px" }}
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
    a: "An unmoderated UX research tool. Build card sorts, tree tests, first-click tests, and surveys, then share a single link with participants.",
  },
  {
    q: "Do participants need an account?",
    a: "No. They open the link, do the study, and you get the results. No sign-in, no download, no friction.",
  },
  {
    q: "What does it cost?",
    a: "$75 once. That's it. Unlimited studies, unlimited responses, forever. No seats, no subscription, no upsells.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. Build as many studies as you want and collect responses for free. Pay only when you want to unlock the results.",
  },
  {
    q: "How do I share a study?",
    a: "Every study gets a shareable link. Drop it into Slack, email, a recruiting panel — anywhere. Responses stream back in real time.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Studies and responses belong to your account and aren't shown to anyone else. You can delete a study at any time.",
  },
];

function FaqList() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <ol className="flex flex-col">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIdx === i;
        return (
          <li key={i} className="border-t border-border last:border-b">
            <button
              type="button"
              onClick={() => setOpenIdx(open ? null : i)}
              className="flex w-full items-start gap-5 py-6 text-left transition-colors hover:bg-muted/30"
              aria-expanded={open}
            >
              <span
                className="font-mono text-muted-foreground shrink-0 pt-1"
                style={{ fontSize: "11px", letterSpacing: "0.08em" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className="font-serif text-foreground block"
                  style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.015em" }}
                >
                  {item.q}
                </span>
                <div className={`faq-answer-grid ${open ? "open" : ""}`}>
                  <span className="faq-answer-inner block mt-3 text-[15px] text-muted-foreground leading-relaxed">
                    {item.a}
                  </span>
                </div>

              </span>
              <span
                className="shrink-0 pt-2 text-muted-foreground font-mono select-none"
                style={{ fontSize: "18px", lineHeight: 1 }}
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

