import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * Thin, full-width sticky top bar. Used on the authenticated app
 * (study list, builder, results). For the marketing/showcase pages
 * (Landing, ExampleStudy) we use the floating pill instead.
 */
export default function TopBar() {
  const { session } = useAuth();
  const location = useLocation();

  // Hide on participant-facing routes — they should be chrome-free.
  if (location.pathname.startsWith("/s/")) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-12 items-center justify-between">
        <Link to="/" className="text-sm font-medium">
          StudyDrop
        </Link>
        <div className="flex items-center gap-2">
          {session ? <SignedInActions /> : <SignInForm />}
        </div>
      </div>
    </header>
  );
}

function SignedInActions() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-3 text-xs"
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
      >
        Sign out
      </Button>
    </>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success(`Link sent to ${email}`);
  };

  if (sent) {
    return (
      <span className="text-xs text-muted-foreground">Check your email</span>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <Input
        type="email"
        required
        aria-label="Email"
        placeholder="you@team.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-8 w-52 text-xs"
      />
      <Button type="submit" size="sm" disabled={submitting} className="h-8 px-3 text-xs">
        {submitting ? "Sending…" : "Get link"}
      </Button>
    </form>
  );
}
