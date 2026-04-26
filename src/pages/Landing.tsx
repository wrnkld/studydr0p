import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StudyType } from "@/lib/types";
import {
  EXAMPLE_STUDIES,
  FRIDGE_STUDY,
  summarizeCardSort,
} from "@/lib/exampleStudies";

interface StudyRow {
  id: string;
  title: string;
  type: StudyType;
  responseCount: number;
}

export default function Landing() {
  const { user, session } = useAuth();
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [loadingStudies, setLoadingStudies] = useState(false);

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

  useEffect(() => {
    if (!user) {
      setStudies([]);
      return;
    }
    setLoadingStudies(true);
    (async () => {
      const { data } = await supabase
        .from("studies")
        .select("id, title, type, responses(count)")
        .eq("researcher_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setStudies(
          (data as any[]).map((s) => ({
            id: s.id,
            title: s.title,
            type: s.type,
            responseCount: s.responses?.[0]?.count ?? 0,
          })),
        );
      }
      setLoadingStudies(false);
    })();
  }, [user]);

  return (
    <>
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

        {session && (
          <>
            <hr className="border-border" />
            {loadingStudies ? (
              <p>Loading…</p>
            ) : studies.length === 0 ? null : (
              <ul className="space-y-1">
                {studies.map((s) => (
                  <li key={s.id}>
                    {s.title || "Untitled"} — {s.type.replace("_", "-")} —{" "}
                    {s.responseCount} response
                    {s.responseCount === 1 ? "" : "s"} —{" "}
                    <Link to={`/studies/${s.id}`} className="underline">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </>
  );
}

// Re-export to keep tree-shaking simple if other modules want this list.
export { EXAMPLE_STUDIES };
