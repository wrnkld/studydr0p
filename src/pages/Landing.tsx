import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TYPES = [
  { id: "card_sort", label: "Card sort" },
  { id: "survey", label: "Survey" },
] as const;

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
    <>
      <AppHeader />
      <main className="p-6 space-y-6 max-w-2xl">
        <div className="space-y-2">
          <h1>UX research, without the friction.</h1>
          <p>
            Studydrop lets you run unmoderated UX studies and share them with
            participants via a single link.
          </p>
        </div>

        <ul className="space-y-1">
          {TYPES.map((t) => (
            <li key={t.id}>
              <Link to={`/build/${t.id}`} className="underline">
                {t.label}
              </Link>
            </li>
          ))}
        </ul>

        <div>
          {sentTo ? (
            <p>Link sent to {sentTo}</p>
          ) : (
            <form onSubmit={onSubmit} className="flex gap-2 max-w-sm">
              <Input
                type="email"
                required
                aria-label="Email"
                placeholder="you@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
