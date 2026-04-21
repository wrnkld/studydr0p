import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { STUDY_TYPE_META, StudyType } from "@/lib/types";

const TYPES: StudyType[] = [
  "card_sort",
  "survey",
  "first_click",
  "tree_test",
  "five_second",
];

// Landing page per wireframe: hero copy, row of the 5 study type tiles
// (each linked to its builder), single Sign in CTA.
export default function Landing() {
  const { session } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-6xl py-20">
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-6xl">
          UX research, without the friction.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Studydrop lets you run unmoderated UX studies and share them with
          participants via a single link. No participant accounts. No
          onboarding. Just answers.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {TYPES.map((t) => {
            const meta = STUDY_TYPE_META[t];
            return (
              <Link
                key={t}
                to={`/build/${t}`}
                className="group flex aspect-square flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
              >
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {String(TYPES.indexOf(t) + 1).padStart(2, "0")}
                </span>
                <span className="text-base font-medium leading-tight">
                  {meta.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-16">
          <Button asChild size="lg">
            <Link to={session ? "/dashboard" : "/login"}>Sign in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
