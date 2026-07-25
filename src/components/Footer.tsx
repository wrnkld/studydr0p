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
      <div className="container flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 text-[13px] text-muted-foreground">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <a href="mailto:hello@studydrop.app" className="hover:text-foreground">
            Contact
          </a>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
        <p className="font-mono uppercase text-muted-foreground/70" style={{ fontSize: "11px", letterSpacing: "0.1em" }}>Payments by Stripe</p>
      </div>
    </footer>
  );
}
