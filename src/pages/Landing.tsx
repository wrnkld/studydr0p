import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";

// Landing page per wireframe: hero copy, row of placeholder tiles, single Sign in CTA.
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
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="aspect-square rounded-2xl border border-border bg-card shadow-sm"
            />
          ))}
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
