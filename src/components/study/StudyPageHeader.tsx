import { useState } from "react";
import {
  Check,
  Download,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { StudyType } from "@/lib/types";

const TYPE_LABEL: Record<StudyType, string> = {
  card_sort: "Card sort",
  survey: "Survey",
  first_click: "First click",
  tree_test: "Tree test",
  five_second: "Five-second test",
};

export interface StudyPageTab<T extends string = string> {
  value: T;
  label: string;
}

/**
 * Local page header that lives at the top of every study detail page.
 * Provides the page's "spine": back chip · type kicker · underline tabs ·
 * right-aligned icon actions (copy / export / delete).
 *
 * Title is intentionally NOT rendered here — it lives in ParticipantShell
 * beneath, so that Preview tab and /s/:slug stay byte-identical.
 */
export function StudyPageHeader<T extends string>({
  type,
  backTo = "/",
  backLabel = "Back",
  tabs,
  activeTab,
  onTabChange,
  shareUrl,
  onExport,
  onDelete,
  className,
}: {
  type: StudyType;
  backTo?: string;
  backLabel?: string;
  tabs: StudyPageTab<T>[];
  activeTab: T;
  onTabChange: (next: T) => void;
  shareUrl?: string | null;
  onExport?: (() => void) | null;
  onDelete?: (() => void) | null;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const iconBtn = "h-8 w-8 text-muted-foreground hover:text-foreground";

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl border-b border-border",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Tabs — left */}
        <div className="flex min-w-0 items-center gap-1">
          {tabs.map((t) => {
            const active = t.value === activeTab;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onTabChange(t.value)}
                className={cn(
                  "relative h-11 px-3 text-sm font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 -bottom-px h-[2px] rounded-full transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                  style={{ background: "hsl(var(--accent-ink))" }}
                />
              </button>
            );
          })}
        </div>

        {/* Actions — right */}
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-2 hidden text-[11px] uppercase tracking-[0.08em] text-muted-foreground/80 font-medium sm:inline">
            {TYPE_LABEL[type]}
          </span>
          {shareUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={copied ? "Link copied" : "Copy link"}
                  className={iconBtn}
                  onClick={copy}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {copied ? "Copied" : "Copy link"}
              </TooltipContent>
            </Tooltip>
          )}
          {onExport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Export CSV"
                  className={iconBtn}
                  onClick={() => onExport()}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export CSV</TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete study"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete study</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

