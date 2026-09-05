import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Flat top bar — white, 1px bottom border. Mono wordmark on the left,
 * global account actions on the right. Sign-out lives in an account menu
 * to keep the primary CTA area clear.
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
      <span className="text-base font-bold font-serif" style={{ letterSpacing: '-0.03em' }}>
        StudyDrop
      </span>
    </Link>
  );
}

function SignedInActions() {
  return <AccountMenu />;
}

function initialsFor(user: { email?: string | null; user_metadata?: Record<string, unknown> } | null) {
  const meta = (user?.user_metadata ?? {}) as { first_name?: string; last_name?: string };
  const first = (meta.first_name ?? "").trim();
  const last = (meta.last_name ?? "").trim();
  if (first || last) return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return (user?.email ?? "?").charAt(0).toUpperCase();
}

function AccountMenu() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error) {
        toast.error(error.message || "Could not delete account. Try again.");
        setDeleting(false);
        return;
      }
      await signOut();
      toast.success("Your account has been deleted");
      navigate("/");
    } catch {
      toast.error("Could not delete account. Try again.");
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {initialsFor(user)}
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-44 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {!paidLoading && (
              isPaid ? (
                <div className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-base text-muted-foreground">
                  Pro plan · active
                </div>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  disabled={upgrading}
                  onClick={async () => {
                    if (!user) return;
                    setUpgrading(true);
                    try {
                      await (await import("@/lib/startCheckout")).startCheckout({
                        userId: user.id,
                        email: user.email ?? undefined,
                        returnTo: "/",
                      });
                    } catch (e) {
                      setUpgrading(false);
                      toast.error((e as Error).message);
                    }
                  }}
                  className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-base text-popover-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
                >
                  {upgrading ? "Loading…" : "Upgrade — $129/yr"}
                </button>
              )
            )}

            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate("/");
              }}
              className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-base text-popover-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sign out
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setDeleteOpen(true);
              }}
              className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-base text-destructive outline-none transition-colors hover:bg-accent"
            >
              Delete account
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, all of your studies, and every response.
              You cannot undo this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-start gap-2">
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} />
              ) : null}
              Delete account
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        className="text-base"
        onClick={() => setOpen(true)}
      >
        Sign in
      </Button>
      <AuthDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

