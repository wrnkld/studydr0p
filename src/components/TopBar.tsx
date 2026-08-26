import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";

/**
 * Flat top bar — white, 1px bottom border. Mono wordmark on the left,
 * global account actions on the right. Sign-out lives in the footer to
 * keep it clear of the primary CTA.
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
          {session ? <SignedInActions /> : <SignInForm />}
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
      <span className="text-sm font-bold font-serif" style={{ letterSpacing: '-0.03em' }}>
        StudyDrop
      </span>
    </Link>
  );
}


function SignedInActions() {
  const navigate = useNavigate();
  return (
    <Button
      size="sm"
      className="text-sm"
      onClick={() => navigate("/studies/new")}
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
      New study
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
        className="text-sm"
        onClick={() => setOpen(true)}
      >
        Sign in
      </Button>
      <AuthDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
