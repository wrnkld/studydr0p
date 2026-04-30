// Renders the canned example studies using the EXACT SAME participant
// and results components used by real studies. The only difference is
// the data is in-memory (seeded). See mem://index.md core rule:
// "Canned example studies MUST render the real participant + results
// components with seeded data — never parallel implementations."

import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  EXAMPLE_STUDIES,
  ExampleResponseRow,
  getExampleStudy,
  makeUserCardSortResponse,
  makeUserSurveyResponse,
} from "@/lib/exampleStudies";
import { PageContainer, PageHeader } from "@/components/study/primitives";
import CardSortParticipant from "@/pages/participant/CardSortParticipant";
import SurveyParticipant from "@/pages/participant/SurveyParticipant";
import CardSortResults from "@/pages/results/CardSortResults";
import SurveyResults from "@/pages/results/SurveyResults";

export default function ExampleStudy() {
  const { id } = useParams();
  const study = id ? getExampleStudy(id) : null;
  const [tab, setTab] = useState<"preview" | "results">("preview");
  const [userResponse, setUserResponse] = useState<ExampleResponseRow | null>(
    null,
  );

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

  // Seed responses + the visitor's submission (if any). This is exactly
  // what the real Results component expects (a list of ResponseRow).
  const allResponses = userResponse
    ? [userResponse, ...study.seedResponses]
    : study.seedResponses;

  return (
    <PageContainer>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "preview" | "results")}
        orientation="vertical"
        className="flex gap-8"
      >
        <TabsList className="flex h-auto w-40 shrink-0 flex-col items-stretch justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="preview"
            className="justify-start rounded-[4px] px-3 py-2 capitalize data-[state=active]:border data-[state=active]:border-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Preview
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="justify-start rounded-[4px] px-3 py-2 capitalize data-[state=active]:border data-[state=active]:border-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Results
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1 space-y-6">
          <PageHeader title={study.title} description={study.description} />

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
                  toast.success(
                    "Thanks! Your answers are mixed into the results.",
                  );
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
                  toast.success(
                    "Thanks! Your answers are mixed into the results.",
                  );
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
