import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useMatch } from "react-router-dom";
import { Check, Copy, LogOut, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useStudyToolbar } from "@/components/StudyToolbarContext";
import { cn } from "@/lib/utils";

/**
 * Flat top bar — white, 1px bottom border. Mono wordmark on the left,
 * contextual actions on the right. No breadcrumb, no back arrow (back
 * navigation lives inside each page's content panel for consistency).
 */
export default function TopBar() {
  const { session } = useAuth();
  const location = useLocation();
  const studyMatch = useMatch("/studies/:id");
  const newStudyMatch = useMatch("/studies/new");
  const { meta, headerTabs } = useStudyToolbar();

  if (location.pathname.startsWith("/s/")) return null;

  const onNewStudyPage = !!newStudyMatch && !!session;
  const onStudyPage = !!studyMatch && !onNewStudyPage && !!session;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground bg-card">
      <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Brand />
        </div>
        <div className="flex justify-center">
          {headerTabs}
        </div>
        <div className="flex items-center justify-end gap-2">
          {onStudyPage ? (
            <StudyActions status={meta?.status} shareUrl={meta?.shareUrl ?? null} />
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
    <Link
      to="/"
      className="text-foreground hover:opacity-80"
      aria-label="StudyDrop home"
    >
      <span className="font-mono text-[15px] font-semibold tracking-[-0.01em]">
        StudyDrop
      </span>
    </Link>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { label: string; dot: string; text: string }> = {
    draft: {
      label: "draft",
      dot: "bg-muted-foreground/60",
      text: "text-muted-foreground",
    },
    live: {
      label: "live",
      dot: "bg-emerald-500",
      text: "text-foreground",
    },
    closed: {
      label: "closed",
      dot: "bg-muted-foreground/60",
      text: "text-muted-foreground",
    },
  };
  const s = map[status] ?? map.draft;
  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 text-[11px] font-medium sm:inline-flex",
        s.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function StudyActions({
  status,
  shareUrl,
}: {
  status?: string;
  shareUrl: string | null;
}) {
  const { actions: _actions, requestDelete } = useStudyToolbar();
  const { actions } = useStudyToolbar();
  void _actions;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <StatusPill status={status} />
      {shareUrl && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Copy share link"
          title="Copy share link"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={copy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete study"
        title="Delete study"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        disabled={!actions}
        onClick={() => (requestDelete ? requestDelete() : actions?.onDelete())}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        className="h-8 px-3 text-xs"
        disabled={!actions || actions.saving}
        onClick={() => actions?.onSave()}
      >
        {actions?.saving ? "Saving…" : "Save"}
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
        className="h-8 gap-1.5 px-3 text-xs"
        onClick={() => navigate("/studies/new")}
      >
        <Plus className="h-3.5 w-3.5" />
        New study
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        title="Sign out"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
      >
        <LogOut className="h-4 w-4" />
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
