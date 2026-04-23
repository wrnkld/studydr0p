import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StudyTypePicker from "@/components/StudyTypePicker";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Landing page per wireframe: hero copy, row of the 5 study type tiles
// (each linked to its builder), inline magic-link sign in.
export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate("/studies", { replace: true });
  }, [session, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/studies` },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSentTo(email);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col items-center justify-center py-20 text-center">
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">
          UX research, without the friction.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Studydrop lets you run unmoderated UX studies and share them with
          participants via a single link. No participant accounts. No
          onboarding. Just answers.
        </p>

        <div className="mt-14 w-full">
          <StudyTypePicker hrefFor={(t) => `/build/${t}`} />
        </div>

        <div className="mt-16 w-full max-w-md">
          {sentTo ? (
            <p className="text-base text-muted-foreground">
              Link sent to <span className="text-foreground">{sentTo}</span>
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Input
                id="email"
                type="email"
                required
                aria-label="Email"
                placeholder="you@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? "Sending…" : "Send"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
