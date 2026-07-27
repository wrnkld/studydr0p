import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType } from "@/lib/types";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/study/primitives";
import { cn } from "@/lib/utils";
import illoCardSort from "@/assets/illo-cardsort.png";
import illoSurvey from "@/assets/illo-survey.png";
import illoTreeTest from "@/assets/illo-treetest.png";
import illoFirstClick from "@/assets/illo-firstclick.png";

type TypeMeta = {
  id: StudyType;
  label: string;
  description: string;
  enabled: boolean;
  illo: string;
};

const TYPES: TypeMeta[] = [
  {
    id: "card_sort",
    label: "Card sort",
    description: "See how people group and label your content.",
    enabled: true,
    illo: illoCardSort,
  },
  {
    id: "survey",
    label: "Survey",
    description: "Ask multiple-choice and rating questions.",
    enabled: true,
    illo: illoSurvey,
  },
  {
    id: "tree_test",
    label: "Tree test",
    description: "Test how findable items are in a navigation structure.",
    enabled: true,
    illo: illoTreeTest,
  },
  {
    id: "first_click",
    label: "First click",
    description: "Where do users click first to complete a task?",
    enabled: true,
    illo: illoFirstClick,
  },
];

// Small accent dot color per study type — one dot of color per row.
const ACCENT_CLASS: Record<StudyType, string> = {
  card_sort: "bg-chart-4",   // yellow
  survey: "bg-chart-3",      // green
  tree_test: "bg-chart-6",   // pink
  first_click: "bg-chart-5", // aqua
};

function isStudyType(value: string): value is StudyType {
  return TYPES.some((t) => t.id === value);
}

export default function NewStudy() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [pendingType, setPendingType] = useState<StudyType | null>(null);

  const create = async (type: StudyType) => {
    if (!user || creating) return;

    setCreating(true);
    const defaultDescription =
      type === "card_sort"
        ? "Sort each item into the group where you think it belongs."
        : type === "survey"
          ? "A few quick questions — should only take a minute."
          : type === "tree_test"
            ? "Navigate the menu to complete each task."
            : type === "first_click"
              ? "Take a look at the screen and click where you'd go first."
              : null;
    const { data, error } = await supabase
      .from("studies")
      .insert({
        researcher_id: user.id,
        title: "Untitled",
        description: defaultDescription,
        type,
        config:
          type === "survey"
            ? { questions: [], layout: "single_page" }
            : type === "card_sort"
              ? { sort_type: "open" }
              : type === "tree_test"
                ? { tasks: [] }
                : type === "first_click"
                  ? { task: "", image_url: "", correct_zone: null }
                  : {},
      })
      .select("id")
      .single();

    setCreating(false);

    if (error || !data) {
      toast.error(error?.message ?? "Failed to create study");
      return;
    }

    navigate(`/studies/${data.id}`);
  };

  useEffect(() => {
    const requestedType = searchParams.get("type");
    if (!user || !requestedType || !isStudyType(requestedType) || creating) return;
    void create(requestedType);
  }, [searchParams, user, creating]);

  return (
    <PageContainer space="lg" width="wide">
      <PageHeader title="What kind of study?" />

      <section
        className="flex flex-col"
        style={{ gap: "16px", paddingTop: "12px", paddingBottom: "12px" }}
      >
        {TYPES.map((t) => {
          const accent = ACCENT_CLASS[t.id];
          return (
            <a
              key={t.id}
              href={t.enabled ? `/studies/new?type=${t.id}` : undefined}
              onClick={(e) => {
                if (!t.enabled || creating) {
                  e.preventDefault();
                  return;
                }
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setPendingType(t.id);
                void create(t.id);
              }}
              aria-label={t.label}
              aria-disabled={!t.enabled || creating}
              className={cn(
                "group relative flex w-full items-center gap-6 rounded-lg border border-border bg-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 no-underline overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-foreground/20",
                (!t.enabled || creating) && "opacity-60 cursor-not-allowed",
                pendingType === t.id && creating && "opacity-80"
              )}
              style={{ padding: "20px 24px" }}
            >
              <div
                className="shrink-0 flex items-center justify-center"
                style={{ width: "88px", height: "88px" }}
                aria-hidden
              >
                <img
                  src={t.illo}
                  alt=""
                  loading="lazy"
                  width={176}
                  height={176}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className="font-serif text-foreground"
                  style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.015em" }}
                >
                  {t.label}
                </div>
                <div
                  className="mt-2 flex items-center gap-2 font-mono uppercase text-muted-foreground"
                  style={{ fontSize: "10px", letterSpacing: "0.12em" }}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${accent}`} aria-hidden />
                  {t.description}
                </div>
              </div>

              {pendingType === t.id && creating && (
                <div className="shrink-0 ml-auto">
                  <svg
                    className="animate-spin h-5 w-5 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              )}
            </a>
          );
        })}
      </section>
    </PageContainer>
  );
}
