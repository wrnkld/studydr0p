import * as React from "react";
import * as Menu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuSeparator = () => <Menu.Separator className="my-1 h-px bg-border" />;
export const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof Menu.Content>, React.ComponentPropsWithoutRef<typeof Menu.Content>>(({ className, sideOffset = 6, ...props }, ref) => (
  <Menu.Portal>
    <Menu.Content ref={ref} sideOffset={sideOffset} className={cn("z-[60] min-w-48 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md", className)} {...props} />
  </Menu.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";
export const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof Menu.Item>, React.ComponentPropsWithoutRef<typeof Menu.Item>>(({ className, ...props }, ref) => (
  <Menu.Item ref={ref} className={cn("flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-base outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0", className)} {...props} />
));
DropdownMenuItem.displayName = "DropdownMenuItem";