import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Global sticky top bar. Mounted once in App.tsx.
// Logged out: logo + inline email/sign-in form.
// Logged in:  logo + New study + Sign out.
export default function AppHeader() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/studies` },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSentTo(email);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="flex items-center justify-between px-4 h-12">
        <Link to={session ? "/studies" : "/"} className="font-medium">
          StudyDrop
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate("/studies/new")}
            >
              New study
            </Button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="underline text-sm"
            >
              Sign out
            </button>
          </div>
        ) : sentTo ? (
          <p className="text-sm text-muted-foreground">
            Link sent to {sentTo}.
          </p>
        ) : (
          <form onSubmit={onSignIn} className="flex items-center gap-2">
            <Input
              type="email"
              required
              aria-label="Email"
              placeholder="you@team.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 w-56"
            />
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Sending…" : "Sign in"}
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
