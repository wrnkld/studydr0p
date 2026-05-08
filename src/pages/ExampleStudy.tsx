// Renders the canned example studies using the EXACT SAME participant
// and results components used by real studies. The only difference is
// the data is in-memory (seeded). See mem://index.md core rule:
// "Canned example studies MUST render the real participant + results
// components with seeded data — never parallel implementations."

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  EXAMPLE_STUDIES,
  ExampleResponseRow,
  getExampleStudy,
  makeUserCardSortResponse,
  makeUserFirstClickResponse,
  makeUserSurveyResponse,
  makeUserTreeTestResponse,
} from "@/lib/exampleStudies";
import { PageContainer, PageHeader } from "@/components/study/primitives";
import { cn } from "@/lib/utils";
import CardSortParticipant from "@/pages/participant/CardSortParticipant";
import SurveyParticipant from "@/pages/participant/SurveyParticipant";
import TreeTestParticipant from "@/pages/participant/TreeTestParticipant";
import FirstClickParticipant from "@/pages/participant/FirstClickParticipant";
import CardSortResults from "@/pages/results/CardSortResults";
import SurveyResults from "@/pages/results/SurveyResults";
import TreeTestResults from "@/pages/results/TreeTestResults";
import FirstClickResults from "@/pages/results/FirstClickResults";

export default function ExampleStudy() {
  const { id } = useParams();
  const study = id ? getExampleStudy(id) : null;
  const [tab, setTab] = useState<"preview" | "results">("preview");
  const [userResponse, setUserResponse] = useState<ExampleResponseRow | null>(
    null,
  );

  const tabsNode = study ? (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1 mb-4">
      {(["preview", "results"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all",
            tab === t
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {{ preview: "Preview", results: "Responses" }[t]}
        </button>
      ))}
    </div>
  ) : null;

  if (!study) {
    return (
      <PageContainer space="sm">
        <PageHeader title="Example not found" />
        <Link to="/" className="underline">
          Back home
        </Link>
      </PageContainer>
    );
  }

  const allResponses = userResponse
    ? [userResponse, ...study.seedResponses]
    : study.seedResponses;

  return (
    <PageContainer width="wide">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "preview" | "results")}
      >
        {tabsNode}
        <PageHeader
          title={study.title}
          description={study.description}
        />

        <div className="mt-6 space-y-6">
          <TabsContent value="preview" className="mt-0">
            {study.type === "card_sort" ? (
              <CardSortParticipant
                study={{
                  id: study.id,
                  title: study.title,
                  description: study.description,
                  config: study.config,
                }}
                sessionId="example"
                startedAt={Date.now()}
                inMemory
                initialCards={study.cards}
                initialCategories={study.categories}
                onSubmitInMemory={(data) => {
                  setUserResponse(makeUserCardSortResponse(data));
                  toast.success("Thank you");
                  setTab("results");
                }}
                onDone={() => {}}
              />
            ) : study.type === "tree_test" ? (
              <TreeTestParticipant
                study={{
                  id: study.id,
                  title: study.title,
                  description: study.description,
                  config: study.config,
                }}
                sessionId="example"
                startedAt={Date.now()}
                inMemory
                initialNodes={study.nodes}
                onSubmitInMemory={(data) => {
                  setUserResponse(makeUserTreeTestResponse(data));
                  toast.success("Thank you");
                  setTab("results");
                }}
                onDone={() => {}}
              />
            ) : (
              <SurveyParticipant
                study={{
                  id: study.id,
                  title: study.title,
                  description: study.description,
                  config: study.config,
                }}
                sessionId="example"
                startedAt={Date.now()}
                inMemory
                onSubmitInMemory={(answers) => {
                  setUserResponse(makeUserSurveyResponse(answers));
                  toast.success("Thank you");
                  setTab("results");
                }}
                onDone={() => {}}
              />
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-0 space-y-4">
            {study.type === "card_sort" ? (
              <CardSortResults
                studyId={study.id}
                cards={study.cards}
                responses={allResponses}
              />
            ) : study.type === "tree_test" ? (
              <TreeTestResults
                studyId={study.id}
                config={study.config}
                responses={allResponses}
              />
            ) : (
              <SurveyResults
                studyId={study.id}
                config={study.config}
                responses={allResponses}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </PageContainer>
  );
}

// Re-export so existing imports continue to work.
export { EXAMPLE_STUDIES };
