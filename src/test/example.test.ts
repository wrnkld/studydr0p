import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

describe("participant preview contract", () => {
  it("uses the same participant experience component for preview and share links", () => {
    const builderSource = readFileSync("src/pages/StudyBuilder.tsx", "utf8");
    const participantSource = readFileSync("src/pages/ParticipantStudy.tsx", "utf8");

    expect(builderSource).toContain("<ParticipantExperience");
    expect(participantSource).toContain("<ParticipantExperience");
    expect(builderSource).toContain('activeTab !== "preview" &&');
    expect(builderSource).not.toContain("<iframe");
    expect(builderSource).not.toContain("/s/${previewStudy.slug}?preview=1");
    expect(builderSource).not.toContain('from "./participant/SurveyParticipant"');
    expect(builderSource).not.toContain('from "./participant/CardSortParticipant"');
    expect(builderSource).not.toContain('from "./participant/TreeTestParticipant"');
  });
});
