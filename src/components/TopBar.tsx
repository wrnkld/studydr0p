import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AuthDialog from "@/components/AuthDialog";

/**
 * Flat top bar — white, 1px bottom border. Mono wordmark on the left,
 * global account actions on the right (new study + sign out). Per-study
 * actions (copy / export / delete) live in the local StudyPageHeader at
 * the top of the study detail page, not here.
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
      <span className="text-[15px] font-bold font-serif" style={{ letterSpacing: '-0.03em' }}>
        StudyDrop
      </span>
    </Link>
  );
}


function SignedInActions() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <Button
        size="sm"
        className="h-8 gap-1.5 px-3 text-sm"
        onClick={() => navigate("/studies/new")}
      >
        <Plus className="h-3.5 w-3.5" />
        New study
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sign out</TooltipContent>
      </Tooltip>
    </>
  );
}

function SignInForm() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 px-3 text-xs"
        onClick={() => setOpen(true)}
      >
        Sign in
      </Button>
      <AuthDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
