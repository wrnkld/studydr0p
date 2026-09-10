import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { usePaid } from "@/hooks/usePaid";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

export default function Account() {
  useDocumentTitle("Account info · StudyDrop");
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPaid, loading: paidLoading } = usePaid();
  const [upgrading, setUpgrading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    <div className="container max-w-5xl py-10">
      <h1 className="text-4xl font-semibold font-serif">Hello world</h1>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {!paidLoading && (
          isPaid ? (
            <span className="text-base text-muted-foreground">Pro plan · active</span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={upgrading}
              onClick={async () => {
                if (!user) return;
                setUpgrading(true);
                try {
                  await (await import("@/lib/startCheckout")).startCheckout({
                    userId: user.id,
                    email: user.email ?? undefined,
                    returnTo: "/account",
                  });
                } catch (e) {
                  setUpgrading(false);
                  toast.error((e as Error).message);
                }
              }}
            >
              {upgrading ? "Loading…" : "Upgrade — $129/yr"}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          Sign out
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Delete account
        </Button>
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
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" strokeWidth={1.5} /> : null}
              Delete account
            </AlertDialogAction>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
