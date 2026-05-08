import { CardSortConfig, StudyType, SurveyConfig, TreeTestConfig } from "@/lib/types";
import SurveyParticipant from "./SurveyParticipant";
import CardSortParticipant from "./CardSortParticipant";
import TreeTestParticipant from "./TreeTestParticipant";

export interface ParticipantStudyData {
  id: string;
  title: string;
  description: string | null;
  type: StudyType;
  config: unknown;
}

export function ParticipantViewport({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}

export function ParticipantMessage({
  title,
  children,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <ParticipantViewport>
      <div className="w-full max-w-lg space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight font-serif">
          {title}
        </h1>
        {children ? <div className="text-sm text-muted-foreground leading-relaxed">{children}</div> : null}
      </div>
    </ParticipantViewport>
  );
}

export function ParticipantExperience({
  study,
  sessionId,
  startedAt,
  preview = false,
  onDone,
}: {
  study: ParticipantStudyData;
  sessionId: string;
  startedAt: number;
  preview?: boolean;
  onDone: () => void;
}) {
  let studyContent: React.ReactNode = null;

  if (study.type === "survey") {
    const cfg = (study.config as SurveyConfig) ?? { questions: [] };
    studyContent = (
      <SurveyParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        preview={preview}
        onDone={onDone}
      />
    );
  } else if (study.type === "card_sort") {
    const cfg = (study.config as CardSortConfig) ?? { sort_type: "open" };
    studyContent = (
      <CardSortParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        preview={preview}
        onDone={onDone}
      />
    );
  } else if (study.type === "tree_test") {
    const cfg = (study.config as TreeTestConfig) ?? { tasks: [] };
    studyContent = (
      <TreeTestParticipant
        study={{ ...study, config: cfg }}
        sessionId={sessionId}
        startedAt={startedAt}
        onDone={onDone}
      />
    );
  } else {
    return <ParticipantMessage title="Unsupported study" />;
  }

  return (
    <ParticipantViewport>
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight font-serif">
            {study.title}
          </h1>
          {study.description ? (
            <p className="whitespace-pre-wrap text-[15px] text-muted-foreground leading-relaxed">
              {study.description}
            </p>
          ) : null}
        </div>
        {studyContent}
      </div>
    </ParticipantViewport>
  );
}