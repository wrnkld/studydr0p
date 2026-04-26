import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getExampleStudy,
  summarizeCardSort,
  summarizeSurvey,
} from "@/lib/exampleStudies";
import FridgeCardSortResults from "@/components/FridgeCardSortResults";
import FridgeCardSortDemo from "@/components/FridgeCardSortDemo";
import GasStationSurveyResults from "@/components/GasStationSurveyResults";
import GasStationSurveyDemo from "@/components/GasStationSurveyDemo";



// Renders a full results view for a hardcoded example study.
// CTA at the bottom: sign-in form (logged out) or duplicate (logged in).
export default function ExampleStudy() {
  const { id } = useParams();
  const isFridge = id === "fridge";
  const isGasStation = id === "gasstation";
  const study = id ? getExampleStudy(id) : null;
  const { session } = useAuth();
  const navigate = useNavigate();
  const [submittedSort, setSubmittedSort] = useState(false);
  const [view, setView] = useState<"results" | "sort">("results");

  if (!study && !isGasStation) {
    return (
      <>

        <main className="p-6 space-y-2">
          <h1>Example not found</h1>
          <Link to="/" className="underline">
            Back home
          </Link>
        </main>
      </>
    );
  }

  const onDuplicate = () => {
    // Example studies are illustrative — duplicate sends them to new study flow.
    navigate(`/studies/new?type=${study.type}`);
  };

  return (
    <main className="container py-8 space-y-6">
      {isFridge || isGasStation ? (
        <>
          <h1>
            {isFridge
              ? "Where does it go in the fridge?"
              : "Gas station food. No judgment."}
          </h1>

          <div className="flex gap-2">
            <Button
              variant={view === "results" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("results")}
            >
              Results
            </Button>
            <Button
              variant={view === "sort" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("sort")}
            >
              {isFridge ? "Sort it" : "Take it"}
            </Button>
          </div>

          {view === "results" ? (
            <>
              {submittedSort && (
                <p className="text-xs text-muted-foreground">
                  {isFridge
                    ? "You and 20 others sorted this."
                    : "You and 20 others answered this."}
                </p>
              )}
              {isFridge ? <FridgeCardSortResults /> : <GasStationSurveyResults />}
            </>
          ) : isFridge ? (
            <FridgeCardSortDemo
              onSubmit={() => {
                setSubmittedSort(true);
                setView("results");
              }}
            />
          ) : (
            <GasStationSurveyDemo
              onSubmit={() => {
                setSubmittedSort(true);
                setView("results");
              }}
            />
          )}
        </>
      ) : study ? (
        <>
          <div className="space-y-1">
            <Link to="/" className="text-sm underline text-muted-foreground">
              ← Examples
            </Link>
            <h1>{study.title}</h1>
            <p className="text-muted-foreground">{study.question}</p>
          </div>
          {study.type === "survey" ? (
            <SurveyResultsView study={study} />
          ) : (
            <CardSortResultsView study={study} />
          )}
        </>
      ) : null}

      {!isFridge && !isGasStation && session && (
        <section className="rounded-md border p-4 space-y-3">
          <p>Like this? Make your own version in your dashboard.</p>
          <Button onClick={onDuplicate}>Duplicate this study</Button>
        </section>
      )}
    </main>
  );
}

function CardSortResultsView({
  study,
}: {
  study: ReturnType<typeof getExampleStudy> & { type: "card_sort" };
}) {
  const summary = summarizeCardSort(study);
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Card</TableHead>
            <TableHead>Most common</TableHead>
            <TableHead>Agreement</TableHead>
            <TableHead>Breakdown</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.map((s) => (
            <TableRow key={s.card}>
              <TableCell className="font-medium">{s.card}</TableCell>
              <TableCell>{s.topCategory}</TableCell>
              <TableCell>{s.agreement}%</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {s.sorted.map(([cat, n]) => `${cat} (${n})`).join(", ")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SurveyResultsView({
  study,
}: {
  study: ReturnType<typeof getExampleStudy> & { type: "survey" };
}) {
  const summary = summarizeSurvey(study);
  return (
    <div className="space-y-6">
      {summary.map((s) => {
        const sorted = Object.entries(s.counts).sort((a, b) => b[1] - a[1]);
        const max = sorted[0]?.[1] ?? 1;
        return (
          <div key={s.question.id} className="space-y-2">
            <h3 className="font-medium">{s.question.label}</h3>
            <ul className="space-y-1">
              {sorted.map(([opt, n]) => {
                const pct = Math.round((n / s.total) * 100);
                return (
                  <li key={opt} className="text-sm">
                    <div className="flex justify-between">
                      <span>{opt}</span>
                      <span className="text-muted-foreground">
                        {n} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(n / max) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
