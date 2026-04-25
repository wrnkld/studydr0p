import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
    <main className="p-6 space-y-6">
      <h1>Studydrop</h1>
      <p>Run unmoderated UX studies. Share via a single link.</p>

      <ul className="space-y-1">
        {TYPES.map((t) => (
          <li key={t.id}>
            <a href={`/build/${t.id}`} className="underline">
              {t.label}
            </a>
          </li>
        ))}
      </ul>

      <div>
        {sentTo ? (
          <p>Link sent to {sentTo}</p>
        ) : (
          <form onSubmit={onSubmit} className="space-x-2">
            <input
              type="email"
              required
              aria-label="Email"
              placeholder="you@team.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border px-2 py-1"
            />
            <button type="submit" disabled={submitting} className="border px-2 py-1">
              {submitting ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
