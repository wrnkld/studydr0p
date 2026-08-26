import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
 * Global footer. Hidden on participant-facing shared links so the study UI
 * stays clean and self-contained.
 */
export default function Footer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (location.pathname.startsWith("/s/")) return null;

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", {
        body: {},
      });

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
    <footer className="w-full border-t border-border bg-background">
      <div className="container flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
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
        {session ? (
          <div className="flex items-center gap-x-4 gap-y-1">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="hover:text-destructive"
            >
              Delete account
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        ) : null}
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
    </footer>
  );
}
