import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-20">
        {sent ? (
          <>
            <h1 className="text-5xl font-semibold tracking-tight">Link sent</h1>
            <p className="mt-6 text-lg text-muted-foreground">
              We sent a magic link to {email}. Click it to continue.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-5xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-6 text-lg text-muted-foreground">
              We'll email you a magic link. No passwords.
            </p>

            <form onSubmit={onSubmit} className="mt-12 max-w-md space-y-4">
              <Input
                id="email"
                type="email"
                required
                aria-label="Email"
                placeholder="you@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-full px-5"
              />
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="rounded-full"
              >
                {submitting ? "Sending…" : "Send"}
              </Button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
