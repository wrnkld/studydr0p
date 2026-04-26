import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Inline email + Sign in form. Reused in the sticky header and on
// example-study pages so behavior + styling stay in sync.
export function InlineSignIn({ className = "" }: { className?: string }) {
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

  if (sentTo) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        Link sent to {sentTo}.
      </p>
    );
  }

  return (
    <form onSubmit={onSignIn} className={`flex items-center gap-2 ${className}`}>
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
  );
}

// Global sticky top bar. Mounted once in App.tsx.
// Logged out: logo + inline email/sign-in form.
// Logged in:  logo + New study + Sign out (grouped together on the right).
export default function AppHeader() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="flex items-center justify-between px-4 h-12">
        <Link to="/" className="font-medium">
          StudyDrop
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={() => navigate("/studies/new")}>
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
        ) : (
          <InlineSignIn />
        )}
      </div>
    </header>
  );
}
