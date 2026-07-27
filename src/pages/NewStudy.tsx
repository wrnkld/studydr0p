import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType } from "@/lib/types";
import { StudyTypeIcon } from "@/lib/studyTypeIcons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, ContentPanel, BackButton } from "@/components/study/primitives";
import { cn } from "@/lib/utils";

type TypeMeta = {
  id: StudyType;
  label: string;
  description: string;
  enabled: boolean;
};

const TYPES: TypeMeta[] = [
  {
    id: "card_sort",
    label: "Card sort",
    description: "See how people group and label your content.",
    enabled: true,
  },
  {
    id: "survey",
    label: "Survey",
    description: "Ask multiple-choice and rating questions.",
    enabled: true,
  },
  {
    id: "tree_test",
    label: "Tree test",
    description: "Test how findable items are in a navigation structure.",
    enabled: true,
  },
  {
    id: "first_click",
    label: "First click",
    description: "Where do users click first to complete a task?",
    enabled: true,
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

  // App palette — matches --chart tokens in index.css.
  const TYPE_COLORS: Record<StudyType, string> = {
    card_sort: "#777BBB",  // chart-1 periwinkle
    survey: "#9BBE45",     // chart-3 green
    tree_test: "#D9795A",  // chart-2 terracotta
    first_click: "#1F6E8C",// chart-5 teal
  };
  const HOVER_ROTATIONS = ["-1.2deg", "1.4deg", "1deg", "-1.6deg"];

  return (
    <PageContainer space="lg" width="wide">
      <PageHeader title="What kind of study?" />

      <section
        className="grid grid-cols-1 sm:grid-cols-2"
        style={{ gap: "20px", paddingTop: "12px", paddingBottom: "12px" }}
      >
        {TYPES.map((t, i) => {
          const hoverRotate = HOVER_ROTATIONS[i % HOVER_ROTATIONS.length];
          const color = TYPE_COLORS[t.id];
          const tint = `${color}33`; // 20% alpha
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
                "group relative flex w-full flex-col rounded-[6px] bg-card text-left text-foreground border border-border transition-[transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 no-underline",
                (!t.enabled || creating) && "opacity-60 cursor-not-allowed",
              )}
              style={{
                height: "240px",
                padding: "28px",
              }}
              onMouseEnter={(e) => {
                if (!t.enabled || creating) return;
                e.currentTarget.style.transform = `rotate(${hoverRotate}) translateY(-2px)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "9999px",
                  backgroundColor: tint,
                  color,
                }}
              >
                <StudyTypeIcon type={t.id} size={24} />
              </div>

              <div className="mt-auto">
                <div
                  className="font-serif text-foreground"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {t.label}
                </div>
                <div
                  className="mt-2 text-muted-foreground"
                  style={{ fontSize: "13px", lineHeight: 1.35 }}
                >
                  {t.description}
                </div>
              </div>
            </a>
          );
        })}
      </section>
    </PageContainer>
  );
}
