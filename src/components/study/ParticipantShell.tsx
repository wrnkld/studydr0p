import { cn } from "@/lib/utils";

/**
 * THE shared shell for the participant experience.
 *
 * This renders the EXACT same layout used by:
 *   - the public participant link (/s/:slug)
 *   - the Preview tab in the study builder
 *
 * One UI. One title. One description. One width. Always.
 *
 * Do NOT render a separate title/description above this shell from a parent.
 * Do NOT wrap the participant components in their own <main>/<container>.
 */
export function ParticipantShell({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl space-y-6", className)}>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight font-serif">
          {title}
        </h1>
        {description ? (
          <p className="whitespace-pre-wrap text-[15px] text-muted-foreground leading-relaxed">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
