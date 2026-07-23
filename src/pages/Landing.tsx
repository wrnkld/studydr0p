import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePaid } from "@/hooks/usePaid";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import { StudyTypeIcon } from "@/lib/studyTypeIcons";
import { PageContainer } from "@/components/study/primitives";
import AuthDialog from "@/components/AuthDialog";

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
  const { isPaid } = usePaid();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  const [unlocking, setUnlocking] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setUserRows([]);
      setLoadedUserRows(false);
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
      setLoadedUserRows(true);
    })();
  }, [user]);

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
        <td className="py-3 px-4 sm:px-8">
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
            <span className="font-serif font-medium text-[16px] tracking-tight truncate text-foreground">
              {r.title}
            </span>
          </div>
        </td>
        <td className="hidden sm:table-cell py-3 px-8 font-mono text-muted-foreground whitespace-nowrap" style={{ fontSize: "12px", letterSpacing: "0.02em" }}>
          {typeLabel}
        </td>
        <td className="hidden sm:table-cell py-3 px-8">
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
        <td className="hidden sm:table-cell py-3 px-8 font-mono tabular-nums text-muted-foreground text-right whitespace-nowrap" style={{ fontSize: "12px" }}>
          {r.responseCount}
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
          className="relative z-10 flex items-center justify-center rounded-full border-2 border-dashed border-border text-foreground select-none shrink-0 bg-card transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default"
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
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : isPaid ? (
            <div className="flex flex-col items-center leading-none text-center" style={{ gap: "4px" }}>
              <span className="font-serif font-bold" style={{ fontSize: "26px", letterSpacing: "-0.02em", lineHeight: 1 }}>
                PAID
              </span>
              <span className="font-mono uppercase text-muted-foreground" style={{ fontSize: "9px", letterSpacing: "0.14em" }}>
                Lifetime
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center leading-none text-center" style={{ gap: "4px" }}>
              <span className="font-serif font-bold" style={{ fontSize: "32px", letterSpacing: "-0.03em", lineHeight: 1 }}>
                $75
              </span>
              <span className="font-mono uppercase text-muted-foreground" style={{ fontSize: "9px", letterSpacing: "0.14em" }}>
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
                <th className="py-2.5 px-4 sm:px-8 font-mono uppercase text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  Study
                </th>
                <th className="hidden sm:table-cell py-2.5 px-8 font-mono uppercase text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  Type
                </th>
                <th className="hidden sm:table-cell py-2.5 px-8 font-mono uppercase text-muted-foreground" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  &nbsp;
                </th>
                <th className="hidden sm:table-cell py-2.5 px-8 font-mono uppercase text-muted-foreground text-right" style={{ fontSize: "10px", letterSpacing: "0.12em", fontWeight: 500 }}>
                  Responses
                </th>
                
              </tr>
            </thead>
            <tbody>{rows.map(renderTableRow)}</tbody>
          </table>
        </section>
        ) : null
      ) : (
        <section
          className="grid grid-cols-1 sm:grid-cols-2"
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

    </PageContainer>
  );
}
