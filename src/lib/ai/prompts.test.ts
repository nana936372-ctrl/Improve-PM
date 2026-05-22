import { describe, expect, it } from "vitest";

import { buildQuestionPrompt } from "./prompts";

describe("buildQuestionPrompt", () => {
  it("includes question type and ability keys", () => {
    const messages = buildQuestionPrompt({
      questionType: "case_analysis",
      abilityKeys: ["ai_boundary"],
      difficulty: "intermediate"
    });
    expect(messages[1].content).toContain("case_analysis");
    expect(messages[1].content).toContain("ai_boundary");
  });
});
