import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutGrid, ListChecks, MousePointerClick, Timer, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType } from "@/lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, ContentPanel, BackButton } from "@/components/study/primitives";
import { cn } from "@/lib/utils";

type TypeMeta = {
  id: StudyType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  color: string;
};

const TYPES: TypeMeta[] = [
  {
    id: "card_sort",
    label: "Card sort",
    description: "See how people group and label your content.",
    icon: LayoutGrid,
    enabled: true,
    color: "#D95F3B",
  },
  {
    id: "survey",
    label: "Survey",
    description: "Ask multiple-choice and rating questions.",
    icon: ListChecks,
    enabled: true,
    color: "#4A6741",
  },
  {
    id: "tree_test",
    label: "Tree test",
    description: "Test how findable items are in a navigation structure.",
    icon: Network,
    enabled: true,
    color: "#3D5A7A",
  },
  {
    id: "first_click",
    label: "First click",
    description: "Where do users click first to complete a task?",
    icon: MousePointerClick,
    enabled: false,
    color: "#C4A020",
  },
  {
    id: "five_second",
    label: "Five-second test",
    description: "What do people remember after a quick glance?",
    icon: Timer,
    enabled: false,
    color: "#6B5B45",
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (!t.enabled || creating) return;
                setPendingType(t.id);
                void create(t.id);
              }}
              disabled={!t.enabled || creating}
              style={{ backgroundColor: t.color }}
              className={cn(
                "group relative text-left rounded-lg p-6 min-h-[180px] flex flex-col justify-between text-white overflow-hidden transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                t.enabled
                  ? "cursor-pointer hover:brightness-90"
                  : "cursor-not-allowed saturate-50 opacity-80",
              )}
            >
              <Icon className="h-6 w-6 text-white/80" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {t.label}
                  </span>
                  {!t.enabled && (
                    <span className="text-[10px] uppercase tracking-[0.12em] rounded-full bg-white/20 px-2 py-0.5 text-white">
                      Soon
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-white/80 leading-relaxed">
                  {t.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </PageContainer>
  );
}
