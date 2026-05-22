import { describe, expect, it } from "vitest";

import { buildAbilitySnapshots } from "./persistence";

describe("buildAbilitySnapshots", () => {
  it("maps dimension scores to database rows", () => {
    const rows = buildAbilitySnapshots("session-1", "user-1", {
      overallScore: 80,
      strengths: [],
      gaps: [],
      advice: "继续训练",
      dimensionScores: [{ key: "ai_boundary", score: 16, maxScore: 20, evidence: "能识别幻觉", advice: "补充评估方法" }]
    });
    expect(rows[0]).toMatchObject({ session_id: "session-1", user_id: "user-1", ability_key: "ai_boundary" });
  });
});
