import { FormEvent, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStudyToolbar } from "./StudyToolbarContext";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex h-12 w-[520px] items-center justify-center gap-3 rounded-full border bg-background px-4 shadow-lg">
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

function Divider() {
  return <Separator orientation="vertical" className="h-5" />;
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
        className="h-8 w-52"
      />
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? "Sending…" : "Sign in"}
      </Button>
    </form>
  );
}

function LoggedOutBar() {
  return (
    <Shell>
      <Logo />
      <Divider />
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
      <Divider />
      <Button size="sm" onClick={() => navigate("/studies/new")}>
        New study
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          await signOut();
          navigate("/");
        }}
      >
        Sign out
      </Button>
    </Shell>
  );
}

function StudyBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { actions } = useStudyToolbar();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const tabParam = searchParams.get("tab");
  const activeTab =
    tabParam === "preview" || tabParam === "results" ? tabParam : "build";

  const setTab = (next: "build" | "preview" | "results") => {
    const params = new URLSearchParams(searchParams);
    if (next === "build") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  const handleDelete = async () => {
    if (!actions) return;
    setDeleting(true);
    try {
      await actions.onDelete();
      navigate("/", { replace: true });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const TabBtn = ({
    value,
    children,
  }: {
    value: "build" | "preview" | "results";
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={cn(
        "text-sm transition-colors",
        activeTab === value
          ? "font-medium text-foreground"
          : "font-normal text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );

  return (
    <>
      <Shell>
        <Logo />
        <Divider />
        <div className="flex items-center gap-3">
          <TabBtn value="build">Build</TabBtn>
          <TabBtn value="preview">Preview</TabBtn>
          <TabBtn value="results">Results</TabBtn>
        </div>
        <Divider />
        <Button
          size="sm"
          disabled={!actions || actions.saving}
          onClick={() => actions?.onSave()}
        >
          {actions?.saving ? "Saving…" : "Save"}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          disabled={!actions}
          onClick={() => setConfirmDelete(true)}
        >
          Delete
        </button>
      </Shell>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the study and all of its responses. This
              action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function FloatingToolbar() {
  const { session } = useAuth();
  const location = useLocation();
  const params = useParams();

  // Hide on participant-facing routes — they should be chrome-free.
  if (location.pathname.startsWith("/s/")) return null;

  // Inside a study (builder) — show the full study toolbar.
  const inStudy =
    !!session &&
    /^\/studies\/[^/]+(\/.*)?$/.test(location.pathname) &&
    params.id !== "new" &&
    !location.pathname.endsWith("/new");

  if (inStudy) return <StudyBar />;
  if (session) return <LoggedInHomeBar />;
  return <LoggedOutBar />;
}
