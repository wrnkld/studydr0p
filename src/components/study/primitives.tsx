// Shared visual primitives. The design system for the app.
//
// Rules:
//   - Pills (rounded-full): tabs, choice options, draggable cards, scale numbers
//   - Frames (rounded-md):  containers, drop zones, stat cards
//   - All colors via design tokens (hsl(var(--*))). No hardcoded colors here.

import * as React from "react";
import { cn } from "@/lib/utils";

// ---------- Page shell ----------

/**
 * Standard page shell. Replaces `<main className="container py-8 …">` everywhere.
 *
 * `width` controls the max content width. Default is the global container.
 * `space` controls vertical rhythm between immediate children.
 */
export function PageContainer({
  children,
  width = "default",
  space = "lg",
  className,
}: {
  children: React.ReactNode;
  width?: "default" | "narrow" | "wide";
  space?: "none" | "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <main
      className={cn(
        "container py-8",
        width === "narrow" && "max-w-2xl",
        width === "wide" && "max-w-5xl",
        space === "sm" && "space-y-2",
        space === "md" && "space-y-4",
        space === "lg" && "space-y-6",
        className,
      )}
    >
      {children}
    </main>
  );
}

/**
 * Page-level header. h1 + optional kicker + optional description.
 */
export function PageHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions (buttons, links). */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {kicker ? (
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground/80 font-medium">
            {kicker}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight leading-tight font-serif">{title}</h1>
        {description ? (
          <p className="text-[15px] text-muted-foreground leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

// ---------- Section header / kicker ----------

/**
 * Section header. Kicker + heading + bottom border. Use inside PageContainer
 * for any sub-section ("Question 1", "By card", etc).
 */
export function SectionHeader({
  kicker,
  title,
  className,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-border/70 pb-3", className)}>
      {kicker ? <ResultLabel>{kicker}</ResultLabel> : null}
      <h3 className="mt-1.5 text-[17px] font-medium tracking-tight">{title}</h3>
    </div>
  );
}

/**
 * One canonical result/section label style. Use for section kickers, stat
 * labels, chart labels, table group labels — anything like QUESTION 1,
 * RESPONSES, MATRIX, WHERE PEOPLE ENDED UP.
 */
export function ResultLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Small uppercase label — used inside containers (drop zones, etc.) where
 * a full SectionHeader would be too heavy.
 */
export function Kicker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <ResultLabel className={className}>{children}</ResultLabel>;
}

// ---------- Frame ----------

/**
 * Bordered container. Used for drop zones, card-like groupings, stat cards.
 */
export const Frame = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    className?: string;
    /** Highlight the frame (e.g., drop-zone hover state). */
    active?: boolean;
  }
>(({ children, className, active }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border/70 bg-card p-4 transition-colors",
        active && "bg-muted/70 border-border",
        className,
      )}
    >
      {children}
    </div>
  );
});
Frame.displayName = "Frame";

// ---------- Stat ----------

/**
 * Numeric stat card. Use inside a grid (e.g., 3-up summary at the top of
 * a results page).
 */
export type StatTone = "indigo" | "green" | "amber" | "neutral";

const TONE_BORDER: Record<StatTone, string> = {
  indigo: "hsl(var(--border))",
  green: "hsl(var(--border))",
  amber: "hsl(var(--border))",
  neutral: "hsl(var(--border))",
};

export function Stat({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div
      className={cn("relative pl-5 py-2", className)}
      style={{ borderLeft: `3px solid ${TONE_BORDER[tone]}` }}
    >
      <ResultLabel>{label}</ResultLabel>
      <div
        className="mt-1 text-foreground"
        style={{
          fontSize: "56px",
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Convenience grid wrapper for a row of stats. Defaults to 3 columns.
 */
export function StatGrid({
  children,
  cols = 3,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-4",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-3",
        cols === 4 && "grid-cols-2 md:grid-cols-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

// ---------- Chip ----------

/**
 * Pill primitive — the universal answer button + draggable card shape.
 * Used for choice options, drag cards, scale numbers.
 *
 * Shape: rounded-full. Always.
 */
export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  selected?: boolean;
  /** Compact circular variant for scale numbers. */
  size?: "default" | "icon";
  /** Use grab cursor (drag affordance). */
  draggable?: boolean;
  /** Stretch to full width and left-align label. */
  block?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      selected,
      size = "default",
      draggable,
      block,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          // base
          "inline-flex items-center justify-center rounded-full border bg-background text-sm font-medium select-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          // size
          size === "icon" ? "h-9 w-9 px-0" : "px-4 py-1.5",
          // block
          block && "w-full justify-start",
          // selected — inverted fill via tokens
          selected &&
            "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background",
          // draggable
          draggable && "cursor-grab active:cursor-grabbing",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Chip.displayName = "Chip";

// ---------- ContentPanel ----------

/**
 * White content panel with the hard offset shadow on warm bg.
 * Use as the inner wrapper for app pages so they all share one container.
 */
export function ContentPanel({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  /** Panel max-width. */
  size?: "narrow" | "default" | "wide";
}) {
  return (
    <div
      className={cn(
        "panel-press mx-auto w-full p-6 sm:p-8",
        size === "narrow" && "max-w-2xl",
        size === "default" && "max-w-3xl",
        size === "wide" && "max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------- BackButton ----------

import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Chunky back button placed at the top-left of a page's content panel.
 * Anchors to the same position relative to the panel on every screen.
 */
export function BackButton({
  to = "/",
  label = "← Back",
  className,
}: {
  to?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        "btn-press inline-flex h-8 items-center gap-1.5 rounded-[4px] bg-card px-3 text-[12px] font-medium text-foreground hover:bg-secondary",
        className,
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span>Back</span>
    </Link>
  );
}
