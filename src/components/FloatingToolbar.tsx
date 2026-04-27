import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex h-11 w-[460px] items-center justify-between gap-3 rounded-full border bg-background px-4 shadow-lg">
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="text-sm font-medium">
      StudyDrop
    </Link>
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
      <span className="text-sm text-muted-foreground">Check your email</span>
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
        className="h-7 w-52 rounded-full text-xs"
      />
      <Button type="submit" size="sm" disabled={submitting} className="h-7 px-3 text-xs">
        {submitting ? "Sending…" : "Get link"}
      </Button>
    </form>
  );
}

function LoggedOutBar() {
  return (
    <Shell>
      <Logo />
      <SignInForm />
    </Shell>
  );
}

function LoggedInHomeBar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <Shell>
      <Logo />
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 px-3 text-xs" onClick={() => navigate("/studies/new")}>
          New study
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          Sign out
        </Button>
      </div>
    </Shell>
  );
}

export default function FloatingToolbar() {
  const { session } = useAuth();
  const location = useLocation();

  // Hide on participant-facing routes — they should be chrome-free.
  if (location.pathname.startsWith("/s/")) return null;

  if (session) return <LoggedInHomeBar />;
  return <LoggedOutBar />;
}
