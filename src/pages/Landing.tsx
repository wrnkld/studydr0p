import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";

const TYPES: StudyType[] = [
  "card_sort",
  "survey",
  "first_click",
  "tree_test",
  "five_second",
];

export default function Landing() {
  const { session } = useAuth();
  const primaryCta = session ? "/dashboard" : "/build/card_sort";
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-3xl py-24">
        <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
          UX research, without the friction.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Studydrop lets you run unmoderated UX studies and share them with
          participants via a single link. No participant accounts. No
          onboarding. Just answers.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to={primaryCta}>Start for free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to={session ? "/dashboard" : "/login"}>Buy for $20</Link>
          </Button>
        </div>

        <div className="mt-20 border-t border-border pt-10">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Five study types
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Click any type to start building — no signup required.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {TYPES.map((t) => {
              const meta = STUDY_TYPE_META[t];
              return (
                <li key={t}>
                  <Link
                    to={`/build/${t}`}
                    className="block rounded-lg border border-border p-5 transition-colors hover:bg-accent/40"
                  >
                    <div className="font-medium">{meta.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {meta.description}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-20 border-t border-border pt-10 text-sm text-muted-foreground">
          <p>
            Free: 1 study, up to 10 responses. $20 one-time unlocks unlimited
            studies and responses, forever.
          </p>
        </div>
      </main>
    </div>
  );
}
