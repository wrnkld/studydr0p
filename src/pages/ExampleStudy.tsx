import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import GasStationSurveyResults, {
  type GasStationAnswers,
} from "@/components/GasStationSurveyResults";
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
  const [tab, setTab] = useState<"preview" | "results">("preview");
  const [gasAnswers, setGasAnswers] = useState<GasStationAnswers | undefined>();
  const [fridgePlacement, setFridgePlacement] = useState<
    Record<string, string> | undefined
  >();

  if (!study && !isGasStation) {
    return (
      <main className="container py-8 space-y-2">
        <h1>Example not found</h1>
        <Link to="/" className="underline">
          Back home
        </Link>
      </main>
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

          <Tabs value={tab} onValueChange={(v) => setTab(v as "preview" | "results")}>
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="pt-4">
              {isFridge ? (
                <FridgeCardSortDemo
                  onSubmit={(placement) => {
                    setFridgePlacement(placement);
                    toast.success("Thanks! Your answers are mixed into the results.");
                    setTab("results");
                  }}
                />
              ) : (
                <GasStationSurveyDemo
                  onSubmit={(answers) => {
                    setGasAnswers({
                      q1: answers.q1 as string | undefined,
                      q2: answers.q2 as number | undefined,
                      q3: answers.q3 as string[] | undefined,
                      q4: answers.q4 as string | undefined,
                      q5: answers.q5 as string | undefined,
                    });
                    toast.success("Thanks! Your answers are mixed into the results.");
                    setTab("results");
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4 pt-4">
              {isFridge ? (
                <FridgeCardSortResults userPlacement={fridgePlacement} />
              ) : (
                <GasStationSurveyResults userAnswers={gasAnswers} />
              )}
            </TabsContent>
          </Tabs>
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
