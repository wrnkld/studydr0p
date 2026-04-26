import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  EXAMPLE_STUDIES,
  FRIDGE_STUDY,
  summarizeCardSort,
} from "@/lib/exampleStudies";

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Pre-compute small summaries for each panel.
  const fridgeSummary = summarizeCardSort(FRIDGE_STUDY);

  // Pick a few interesting cards for the fridge teaser.
  const fridgeHighlights = ["Ketchup", "Birthday cake", "Mystery tupperware"]
    .map((c) => fridgeSummary.find((s) => s.card === c))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  // Hand-picked highlights for the gas station survey teaser.
  const gasHighlights = [
    { label: "Ever eaten a gas station hot dog?", top: "Yes", pct: 50 },
    { label: "Average food rating", top: "5.8 / 10", pct: null as number | null },
    { label: "Most-eaten item", top: "Beef jerky", pct: 85 },
  ];

  const onSignIn = async (e: FormEvent) => {
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
      <main className="p-6 space-y-8 max-w-3xl">
        <div className="space-y-2">
          <h1>UX research, without the friction.</h1>
          <p>
            Studydrop lets you run unmoderated UX studies and share them with
            participants via a single link.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            to={`/examples/${FRIDGE_STUDY.id}`}
            className="block rounded-lg border border-border p-4 hover:bg-accent transition-colors"
          >
            <div className="text-xs uppercase text-muted-foreground">
              Card sort · {FRIDGE_STUDY.responses.length} responses
            </div>
            <h2 className="mt-1 text-lg font-semibold">{FRIDGE_STUDY.title}</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {fridgeHighlights.map((h) => (
                <li key={h.card}>
                  <span className="font-medium">{h.card}</span> →{" "}
                  {h.topCategory}{" "}
                  <span className="text-muted-foreground">
                    ({h.agreement}% agreed)
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-sm underline">See full results →</div>
          </Link>

          <Link
            to="/examples/gasstation"
            className="block rounded-lg border border-border p-4 hover:bg-accent transition-colors"
          >
            <div className="text-xs uppercase text-muted-foreground">
              Survey · 20 responses
            </div>
            <h2 className="mt-1 text-lg font-semibold">
              Gas station food. No judgment.
            </h2>
            <ul className="mt-3 space-y-1 text-sm">
              {gasHighlights.map((h) => (
                <li key={h.label}>
                  <span className="font-medium">{h.label}</span>{" "}
                  <span className="text-muted-foreground">
                    — {h.top}
                    {h.pct !== null ? ` (${h.pct}%)` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-sm underline">See full results →</div>
          </Link>
        </section>

        <section>
          {session ? (
            <Button onClick={() => navigate("/studies/new")}>New study</Button>
          ) : sentTo ? (
            <p>Link sent to {sentTo}. Check your email to sign in.</p>
          ) : (
            <form onSubmit={onSignIn} className="flex gap-2 max-w-sm">
              <Input
                type="email"
                required
                aria-label="Email"
                placeholder="you@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Sign in"}
              </Button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}

// Re-export to keep tree-shaking simple if other modules want this list.
export { EXAMPLE_STUDIES };
