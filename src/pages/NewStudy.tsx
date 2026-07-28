import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType, STUDY_TYPE_META } from "@/lib/types";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/study/primitives";
import { cn } from "@/lib/utils";
import illoCardSortAsset from "@/assets/illo-cardsort.svg.asset.json";
import illoSurveyAsset from "@/assets/illo-survey.svg.asset.json";
import illoTreeTestAsset from "@/assets/illo-treetest.svg.asset.json";
import illoFirstClickAsset from "@/assets/illo-firstclick.svg.asset.json";
const illoCardSort = illoCardSortAsset.url;
const illoSurvey = illoSurveyAsset.url;
const illoTreeTest = illoTreeTestAsset.url;
const illoFirstClick = illoFirstClickAsset.url;

type TypeMeta = {
  id: StudyType;
  description: string;
  illo: string;
};

const TYPES: TypeMeta[] = [
  {
    id: "card_sort",
    description: "See how people group and label your content.",
    illo: illoCardSort,
  },
  {
    id: "survey",
    description: "Ask multiple-choice and rating questions.",
    illo: illoSurvey,
  },
  {
    id: "tree_test",
    description: "Test how findable items are in a navigation structure.",
    illo: illoTreeTest,
  },
  {
    id: "first_click",
    description: "Where do users click first to complete a task?",
    illo: illoFirstClick,
  },
];

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

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {TYPES.map((t) => {
          const label = STUDY_TYPE_META[t.id]?.label ?? t.id;
          const href = `/studies/new?type=${t.id}`;
          const isPending = pendingType === t.id && creating;
          return (
            <a
              key={t.id}
              href={href}
              onClick={(e) => {
                if (creating) {
                  e.preventDefault();
                  return;
                }
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setPendingType(t.id);
                void create(t.id);
              }}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  window.open(href, "_blank", "noopener");
                }
              }}
              aria-label={label}
              aria-disabled={creating}
              className={cn(
                "group relative flex w-full flex-col rounded-lg border border-border bg-card text-left no-underline overflow-hidden transition-colors duration-150 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                creating && "opacity-60 cursor-not-allowed",
                isPending && "opacity-80",
              )}
              style={{ padding: "28px 28px 24px" }}
            >
              <div className="mb-5" aria-hidden>
                <img
                  src={t.illo}
                  alt=""
                  loading="lazy"
                  width={180}
                  height={180}
                  className="block h-[180px] w-[180px]"
                />
              </div>

              <div className="min-w-0">
                <div
                  className="font-serif text-foreground"
                  style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.015em" }}
                >
                  {label}
                </div>
                <p className="mt-2 text-base text-muted-foreground leading-relaxed">
                  {t.description}
                </p>
              </div>
            </a>
          );
        })}
      </section>
    </PageContainer>
  );
}
