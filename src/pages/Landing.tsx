import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import {
  EXAMPLE_STUDIES,
  FRIDGE_STUDY,
  summarizeCardSort,
} from "@/lib/exampleStudies";

export default function Landing() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate("/studies", { replace: true });
  }, [session, navigate]);

  // Pre-compute small summaries for each panel.
  const fridgeSummary = summarizeCardSort(FRIDGE_STUDY);
  const surveySummary = summarizeSurvey(REMOTE_STUDY);

  // Pick a few interesting cards for the fridge teaser.
  const fridgeHighlights = ["Ketchup", "Birthday cake", "Mystery tupperware"]
    .map((c) => fridgeSummary.find((s) => s.card === c))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

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
            to={`/examples/${REMOTE_STUDY.id}`}
            className="block rounded-lg border border-border p-4 hover:bg-accent transition-colors"
          >
            <div className="text-xs uppercase text-muted-foreground">
              Survey · {REMOTE_STUDY.responses.length} responses
            </div>
            <h2 className="mt-1 text-lg font-semibold">{REMOTE_STUDY.title}</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {surveySummary.map((s) => {
                const top = Object.entries(s.counts).sort(
                  (a, b) => b[1] - a[1],
                )[0];
                if (!top) return null;
                const pct = Math.round((top[1] / s.total) * 100);
                return (
                  <li key={s.question.id}>
                    <span className="font-medium">{s.question.label}</span>{" "}
                    <span className="text-muted-foreground">
                      — top: {top[0]} ({pct}%)
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 text-sm underline">See full results →</div>
          </Link>
        </section>
      </main>
    </>
  );
}

// Re-export to keep tree-shaking simple if other modules want this list.
export { EXAMPLE_STUDIES };
