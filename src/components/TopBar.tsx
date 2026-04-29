import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useMatch } from "react-router-dom";
import { ArrowLeft, Check, Copy, LogOut, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useStudyToolbar } from "@/components/StudyToolbarContext";
import { cn } from "@/lib/utils";

/**
 * Global top bar.
 *  - Logged out: wordmark + email magic-link form.
 *  - Logged in (general): wordmark + New study + account menu.
 *  - Study page: back arrow · breadcrumb (wordmark / live title) · status pill ·
 *                Save · overflow menu (copy link, delete).
 * Hidden on participant routes.
 */
export default function TopBar() {
  const { session } = useAuth();
  const location = useLocation();
  const studyMatch = useMatch("/studies/:id");
  const newStudyMatch = useMatch("/studies/new");
  const { meta } = useStudyToolbar();

  if (location.pathname.startsWith("/s/")) return null;

  const onNewStudyPage = !!newStudyMatch && !!session;
  const onStudyPage = !!studyMatch && !onNewStudyPage && !!session;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onStudyPage ? (
            <StudyCrumb title={meta?.title ?? "Untitled study"} />
          ) : onNewStudyPage ? (
            <StudyCrumb title="New study" />
          ) : (
            <Brand />
          )}
        </div>
        <div className="flex items-center gap-2">
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

function BrandMark({ className }: { className?: string }) {
  // 2x2 dot grid, top-right dot displaced + accent color.
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="4" cy="4" r="1.6" fill="currentColor" />
      <circle cx="4" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      {/* displaced + accent */}
      <circle cx="14" cy="2" r="1.8" fill="#4F75FF" />
    </svg>
  );
}

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-2 text-foreground">
      <BrandMark />
      <span
        className="text-[15px] font-extrabold tracking-[-0.02em] [font-stretch:condensed]"
        style={{ fontFamily: '"Inter", "Helvetica Neue", system-ui, sans-serif' }}
      >
        StudyDrop
      </span>
    </Link>
  );
}

function StudyCrumb({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Link
        to="/"
        aria-label="Back to studies"
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <Link
        to="/"
        className="hidden items-center gap-1.5 text-[12px] font-bold tracking-[-0.02em] text-muted-foreground hover:text-foreground sm:inline-flex"
      >
        <BrandMark className="opacity-80" />
        StudyDrop
      </Link>
      <span className="hidden text-muted-foreground/50 sm:inline">/</span>
      <span className="truncate text-[13px] font-medium">{title}</span>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { label: string; dot: string; text: string }> = {
    draft: {
      label: "Draft",
      dot: "bg-muted-foreground/60",
      text: "text-muted-foreground",
    },
    live: {
      label: "Live",
      dot: "bg-emerald-500",
      text: "text-foreground",
    },
    closed: {
      label: "Closed",
      dot: "bg-muted-foreground/60",
      text: "text-muted-foreground",
    },
  };
  const s = map[status] ?? map.draft;
  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] font-medium sm:inline-flex",
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
  const { actions, requestDelete } = useStudyToolbar();
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
          size="sm"
          aria-label="Copy share link"
          title="Copy share link"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={copy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Delete study"
        title="Delete study"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
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
        size="sm"
        aria-label="Sign out"
        title="Sign out"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
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
