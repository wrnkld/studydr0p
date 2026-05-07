import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});

describe("participant preview contract", () => {
  it("renders the real share route instead of a parallel participant implementation", () => {
    const builderSource = readFileSync("src/pages/StudyBuilder.tsx", "utf8");

    expect(builderSource).toContain("<iframe");
    expect(builderSource).toContain('src={`/s/${previewStudy.slug}?preview=1`}');
    expect(builderSource).not.toContain('from "./participant/SurveyParticipant"');
    expect(builderSource).not.toContain('from "./participant/CardSortParticipant"');
    expect(builderSource).not.toContain('from "./participant/TreeTestParticipant"');
  });
});
