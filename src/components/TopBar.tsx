import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useMatch } from "react-router-dom";
import { Check, ClipboardList, Download, Link2, LogOut, MoreHorizontal, Plus, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useStudyToolbar } from "@/components/StudyToolbarContext";
import { Badge } from "@/components/ui/badge";
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
  const { meta } = useStudyToolbar();

  if (location.pathname.startsWith("/s/")) return null;

  const onNewStudyPage = !!newStudyMatch && !!session;
  const onStudyPage = !!studyMatch && !onNewStudyPage && !!session;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card">
      <div className="container max-w-5xl flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Brand />
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
      className="flex items-center gap-2.5 text-foreground hover:opacity-80"
      aria-label="StudyDrop home"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background">
        <ClipboardList className="h-4 w-4" />
      </div>
      <span className="text-[15px] font-semibold tracking-tight font-serif">
        StudyDrop
      </span>
    </Link>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  if (status === "live") {
    return (
      <Badge
        variant="outline"
        className="h-6 gap-1.5 border-emerald-500/40 px-2 py-0 text-[10px] text-emerald-700 dark:text-emerald-400"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Live
      </Badge>
    );
  }
  const label = status === "closed" ? "Closed" : "Draft";
  return (
    <Badge
      variant="outline"
      className="h-6 px-2 py-0 text-[10px] text-muted-foreground"
    >
      {label}
    </Badge>
  );
}

function StudyActions({
  status,
  shareUrl,
}: {
  status?: string;
  shareUrl: string | null;
}) {
  const { actions, requestDelete, exportCsv } = useStudyToolbar();
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Study actions"
            title="Study actions"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {shareUrl && (
            <DropdownMenuItem onSelect={copy}>
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Copy share link
            </DropdownMenuItem>
          )}
          {exportCsv && (
            <DropdownMenuItem onSelect={() => exportCsv()}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </DropdownMenuItem>
          )}
          {(shareUrl || exportCsv) && <DropdownMenuSeparator />}
          <DropdownMenuItem
            disabled={!requestDelete && !actions}
            onSelect={() =>
              requestDelete ? requestDelete() : actions?.onDelete()
            }
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sign out</TooltipContent>
      </Tooltip>
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
