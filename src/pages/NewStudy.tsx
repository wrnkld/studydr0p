import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutGrid, ListChecks, MousePointerClick, Timer, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType } from "@/lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/study/primitives";
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
    enabled: false,
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
    enabled: false,
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
  const [selected, setSelected] = useState<StudyType | null>(null);

  const create = async (type: StudyType) => {
    if (!user || creating) return;

    setCreating(true);
    const { data, error } = await supabase
      .from("studies")
      .insert({
        researcher_id: user.id,
        title: "Untitled",
        type,
        config:
          type === "survey"
            ? { questions: [], layout: "single_page" }
            : type === "card_sort"
              ? { sort_type: "open" }
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
    <PageContainer space="lg">
      <PageHeader title="What kind of study?" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => t.enabled && setSelected(t.id)}
              disabled={!t.enabled}
              aria-pressed={isSelected}
              className={cn(
                "group relative text-left rounded-xl border bg-card p-5 transition-all",
                "shadow-[0_1px_2px_rgba(20,20,15,0.04)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                t.enabled
                  ? "hover:border-foreground/40 cursor-pointer"
                  : "opacity-50 cursor-not-allowed",
                isSelected
                  ? "border-foreground ring-1 ring-foreground"
                  : "border-border/70",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background transition-colors",
                    isSelected && "border-foreground bg-foreground text-background",
                  )}
                >
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
        })}
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          selected
            ? "max-h-40 opacity-100 translate-y-0"
            : "max-h-0 opacity-0 -translate-y-1 pointer-events-none",
        )}
      >
        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(20,20,15,0.04)] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/80 font-medium">
              Selected
            </div>
            <div className="mt-1 text-[15px] font-medium tracking-tight">
              {TYPES.find((t) => t.id === selected)?.label}
            </div>
          </div>
          <Button
            onClick={() => selected && void create(selected)}
            disabled={!selected || creating}
          >
            {creating ? "Creating…" : "Create study"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
