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
};

const TYPES: TypeMeta[] = [
  {
    id: "card_sort",
    label: "Card sort",
    description: "See how people group and label your content.",
    icon: LayoutGrid,
    enabled: true,
  },
  {
    id: "survey",
    label: "Survey",
    description: "Ask multiple-choice and rating questions.",
    icon: ListChecks,
    enabled: true,
  },
  {
    id: "first_click",
    label: "First click",
    description: "Where do users click first to complete a task?",
    icon: MousePointerClick,
    enabled: true,
  },
  {
    id: "five_second",
    label: "Five-second test",
    description: "What do people remember after a quick glance?",
    icon: Timer,
    enabled: false,
  },
  {
    id: "tree_test",
    label: "Tree test",
    description: "Test how findable items are in a navigation structure.",
    icon: Network,
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

      <div className="grid grid-cols-1 gap-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const card = (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (!t.enabled || creating) return;
                  setPendingType(t.id);
                  void create(t.id);
                }}
                disabled={!t.enabled || creating}
                className={cn(
                  "group relative text-left rounded-lg border border-border/70 bg-card p-5 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  t.enabled
                    ? "hover:bg-muted/40 cursor-pointer"
                    : "opacity-50 cursor-not-allowed",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium tracking-tight">
                        {t.label}
                      </span>
                      {!t.enabled && (
                        <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                </div>
              </button>
            );

            return card;
          })}
      </div>
    </PageContainer>
  );
}
