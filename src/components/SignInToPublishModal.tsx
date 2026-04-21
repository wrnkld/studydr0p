import { FormEvent, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// Sends a magic link that, on return, lands on /dashboard?claim=1 so the
// dashboard can pick up the localStorage draft and persist it.
export default function SignInToPublishModal({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard?claim=1`,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to publish</DialogTitle>
          <DialogDescription>
            Your study is saved in this browser. Enter your email to save it to
            an account and get a shareable link.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="rounded-lg border border-border p-4">
            <div className="font-medium">Check your inbox</div>
            <p className="mt-1 text-sm text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>. Click it to
              finish publishing.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="publish-email">Email</Label>
              <Input
                id="publish-email"
                type="email"
                required
                placeholder="you@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending…" : "Send magic link"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              We won't lose your work. The draft stays in this browser until
              you sign in.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
