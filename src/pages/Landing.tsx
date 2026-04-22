import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import StudyTypePicker from "@/components/StudyTypePicker";
import { useAuth } from "@/hooks/useAuth";

// Landing page per wireframe: hero copy, row of the 5 study type tiles
// (each linked to its builder), single Sign in CTA.
export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate("/studies", { replace: true });
  }, [session, navigate]);

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

        <div className="mt-16">
          <Button asChild size="lg">
            <Link to={session ? "/studies" : "/login"}>Sign in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
