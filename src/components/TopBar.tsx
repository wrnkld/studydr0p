import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useMatch } from "react-router-dom";
import { ArrowLeft, Check, Copy, LogOut, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { meta } = useStudyToolbar();

  if (location.pathname.startsWith("/s/")) return null;

  const onStudyPage = !!studyMatch && !!session;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onStudyPage ? <StudyCrumb title={meta?.title ?? "Untitled study"} /> : <Brand />}
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

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      <span className="font-mono text-[13px] font-medium tracking-tight">
        studydrop
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
        className="hidden font-mono text-[12px] text-muted-foreground hover:text-foreground sm:inline"
      >
        studydrop
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
    if (!shareUrl) {
      toast.message("Publish the study to get a share link.");
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Share link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <StatusPill status={status} />
      <Button
        size="sm"
        className="h-8 px-3 text-xs"
        disabled={!actions || actions.saving}
        onClick={() => actions?.onSave()}
      >
        {actions?.saving ? "Saving…" : "Save"}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="More actions"
            disabled={!actions}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); copy(); }}>
            {copied ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy share link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => (requestDelete ? requestDelete() : actions?.onDelete())}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete study
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function SignedInActions() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const email = session?.user?.email ?? "";
  const initial = email.slice(0, 1).toUpperCase() || "?";
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Account"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-muted text-[11px] font-medium text-foreground hover:bg-accent"
          >
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {email && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
              {email}
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={async () => {
              await signOut();
              navigate("/");
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
