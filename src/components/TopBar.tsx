import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";

/**
 * Flat top bar — white, 1px bottom border. Mono wordmark on the left,
 * global account actions on the right.
 */
export default function TopBar() {
  const { session } = useAuth();
  const location = useLocation();

  if (location.pathname.startsWith("/s/")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
      <div className="container max-w-5xl flex h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <Brand />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {session ? <AccountButton /> : <SignInForm />}
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <Link
      to="/"
      className="text-foreground hover:opacity-80"
      aria-label="StudyDrop home"
    >
      <span className="text-base font-bold font-serif" style={{ letterSpacing: '-0.03em' }}>
        StudyDrop
      </span>
    </Link>
  );
}

function AccountButton() {
  return (
    <Button asChild size="sm" variant="outline" className="text-base">
      <Link to="/account">Account info</Link>
    </Button>
  );
}

function SignInForm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-base"
        onClick={() => setOpen(true)}
      >
        Sign in
      </Button>
      <AuthDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
