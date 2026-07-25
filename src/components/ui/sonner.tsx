import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { Check, X, AlertTriangle, Info, LoaderCircle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      icons={{
        success: <Check className="h-4 w-4" strokeWidth={1.5} />,
        error: <X className="h-4 w-4" strokeWidth={1.5} />,
        warning: <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />,
        info: <Info className="h-4 w-4" strokeWidth={1.5} />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.5} />,
      }}
      style={{ fontFamily: "'Calibre', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:text-sm group-[.toaster]:!font-normal",
          title: "text-sm !font-normal",
          description: "text-sm !font-normal text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
