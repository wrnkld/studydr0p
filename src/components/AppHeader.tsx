import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function InlineSignIn({ className = "" }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSignIn = async (e: FormEvent) => {
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
        className="w-56"
      />
      <Button type="submit" size="sm" disabled={submitting}>
        {submitting ? "Sending…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function AppHeader() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Participant view stays chrome-free.
  if (location.pathname.startsWith("/s/")) return null;

  return (
    <header className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <Link
          to="/"
          className="text-foreground hover:opacity-80"
          aria-label="StudyDrop home"
        >
          <span className="text-[15px] font-bold font-serif" style={{ letterSpacing: '-0.03em' }}>
            StudyDrop
          </span>
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
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
          </div>
        ) : (
          <InlineSignIn />
        )}
      </div>
    </header>
  );
}
