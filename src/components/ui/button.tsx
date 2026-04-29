import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Chunky press-button system.
 *
 * Variants `default`, `outline`, `secondary`, `destructive` get the hard
 * 4px offset shadow + 1px ink border + nearly-square 4px radius.
 * Hover collapses the shadow to 2px and translates +(2,2). Active goes to 0.
 *
 * `ghost` and `link` stay flat — used for icon buttons inside the nav.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "btn-press bg-foreground text-background hover:bg-foreground/95",
        destructive:
          "btn-press bg-destructive text-destructive-foreground hover:bg-destructive/95",
        outline:
          "btn-press bg-card text-foreground hover:bg-secondary",
        secondary:
          "btn-press bg-secondary text-foreground hover:bg-secondary/80",
        ghost:
          "rounded-[4px] hover:bg-secondary hover:text-foreground transition-colors",
        link: "text-foreground underline-offset-4 hover:underline rounded-[4px]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
