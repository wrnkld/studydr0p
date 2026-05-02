import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] select-none",
  {
    variants: {
      variant: {
        default:
          "border-border/70 bg-secondary text-secondary-foreground/80",
        secondary:
          "border-border/70 bg-secondary text-secondary-foreground/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border/70 text-foreground/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
