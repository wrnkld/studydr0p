import { Link, useLocation } from "react-router-dom";

/**
 * Global footer. Hidden on participant-facing shared links so the study UI
 * stays clean and self-contained.
 */
export default function Footer() {
  const location = useLocation();

  if (location.pathname.startsWith("/s/")) return null;

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container max-w-5xl py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              to="/"
              className="inline-block font-serif text-[15px] font-bold tracking-tight text-foreground hover:opacity-80"
              style={{ letterSpacing: "-0.03em" }}
            >
              StudyDrop
            </Link>
            <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Run and share unmoderated UX studies with a single link.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <a
              href="mailto:hello@studydrop.app"
              className="hover:text-foreground"
            >
              Contact
            </a>
            <Link to="/" className="hover:text-foreground">
              Refund policy
            </Link>
            <Link to="/" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
            © {new Date().getFullYear()} StudyDrop
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
            Payments processed by Stripe
          </p>
        </div>
      </div>
    </footer>
  );
}
