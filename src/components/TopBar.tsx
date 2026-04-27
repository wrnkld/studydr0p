import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useMatch } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useStudyToolbar } from "@/components/StudyToolbarContext";

/**
 * Single global top bar. Three modes:
 *  - Logged out: StudyDrop · email + Get link
 *  - Logged in (general): StudyDrop · New study · Sign out
 *  - Logged in on a study page: ← Back · Save · Delete
 * Hidden on participant routes.
 */
export default function TopBar() {
  const { session } = useAuth();
  const location = useLocation();
  const studyMatch = useMatch("/studies/:id");
  const { actions } = useStudyToolbar();

  if (location.pathname.startsWith("/s/")) return null;

  const onStudyPage = !!studyMatch && !!session;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-12 items-center justify-between gap-3">
        {onStudyPage ? <BackLink /> : <Brand />}
        <div className="flex items-center gap-2">
          {onStudyPage ? (
            <StudyActions />
          ) : session ? (
            <SignedInActions />
          ) : (
            <SignInForm />
          )}
        </div>
      </div>
    </header>
  );
}

function Brand() {
  return (
    <Link to="/" className="text-sm font-medium">
      StudyDrop
    </Link>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      ← Back
    </Link>
  );
}

function StudyActions() {
  const { actions } = useStudyToolbar();
  return (
    <>
      <Button
        size="sm"
        className="h-8 px-3 text-xs"
        disabled={!actions || actions.saving}
        onClick={() => actions?.onSave()}
      >
        {actions?.saving ? "Saving…" : "Save"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 text-xs"
        disabled={!actions}
        onClick={() => actions?.onDelete()}
      >
        Delete
      </Button>
    </>
  );
}

function SignedInActions() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <Button
        size="sm"
        className="h-8 px-3 text-xs"
        onClick={() => navigate("/studies/new")}
      >
        New study
      </Button>
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
