// Shared visual primitives used by canned demos and results pages.
// Goal: one vocabulary so previews and results read as the same product.

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Section header. Used everywhere a numbered question, a results section,
 * or a step indicator appears.
 *
 * Layout: small uppercase kicker + heading + bottom border.
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
    <div className={cn("border-b pb-2", className)}>
      {kicker ? (
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {kicker}
        </div>
      ) : null}
      <h3 className="mt-1 text-base font-medium">{title}</h3>
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
  return (
    <div
      className={cn(
        "text-xs uppercase tracking-wide text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Bordered container. Used for drop zones and any "card-like" grouping
 * where children need a frame.
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
        "rounded-md border p-3 transition-colors",
        active && "bg-muted",
        className,
      )}
    >
      {children}
    </div>
  );
});
Frame.displayName = "Frame";

/**
 * Pill/chip primitive — the universal answer button + draggable card shape.
 * Used for choice options, drag cards, scale numbers.
 */
export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  selected?: boolean;
  /** Compact square variant for scale numbers. */
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
          "inline-flex items-center justify-center rounded-md border bg-background text-sm font-medium select-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          // size
          size === "icon" ? "h-9 w-9 px-0" : "px-3 py-1.5",
          // block
          block && "w-full justify-start",
          // selected — shadcn-default-button-equivalent: dark bg, light text
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
