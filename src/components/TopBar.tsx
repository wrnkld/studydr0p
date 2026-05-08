import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate, useMatch } from "react-router-dom";
import {
  Check,
  Link as LinkIcon,
  LogOut,
  Plus,
  Trash2,
  Download,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useStudyToolbar } from "@/components/StudyToolbarContext";

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
      <div className="container max-w-5xl flex h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <Brand />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          {onStudyPage ? (
            <StudyActions shareUrl={meta?.shareUrl ?? null} />
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
      <span className="text-[15px] font-bold font-serif" style={{ letterSpacing: '-0.03em' }}>
        StudyDrop
      </span>
    </Link>
  );
}

function StudyActions({
  shareUrl,
}: {
  shareUrl: string | null;
}) {
  const { actions, requestDelete, exportCsv } = useStudyToolbar();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const iconBtn =
    "h-8 w-8 text-muted-foreground hover:text-foreground";

  return (
    <>
      {shareUrl && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={copied ? "Link copied" : "Copy link"}
              className={iconBtn}
              onClick={copy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied" : "Copy link"}</TooltipContent>
        </Tooltip>
      )}
      {exportCsv && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Export CSV"
              className={iconBtn}
              onClick={() => exportCsv()}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export CSV</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete study"
            disabled={!requestDelete && !actions}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() =>
              requestDelete ? requestDelete() : actions?.onDelete()
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete study</TooltipContent>
      </Tooltip>
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
        className="h-8 gap-1.5 px-3 text-sm"
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
    <form onSubmit={onSubmit} className="flex min-w-0 items-center gap-2">
      <Input
        type="email"
        required
        aria-label="Email"
        placeholder="you@team.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-8 min-w-0 flex-1 text-xs sm:w-52 sm:flex-none"
      />
      <Button type="submit" size="sm" disabled={submitting} className="h-8 shrink-0 px-3 text-xs">
        {submitting ? "Sending…" : "Get link"}
      </Button>
    </form>
  );
}
