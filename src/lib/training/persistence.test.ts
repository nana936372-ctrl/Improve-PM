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

  it("normalizes AI-generated ability aliases before building snapshots", () => {
    const rows = buildAbilitySnapshots("session-1", "user-1", {
      overallScore: 80,
      strengths: [],
      gaps: [],
      advice: "继续训练",
      dimensionScores: [{ key: "risk_awareness", score: 14, maxScore: 20, evidence: "提到风险", advice: "补充治理" }]
    });

    expect(rows[0].ability_key).toBe("risk_governance");
  });

  it("scales 100-point choice explanations into 20-point ability snapshots", () => {
    const rows = buildAbilitySnapshots("session-1", "user-1", {
      overallScore: 100,
      strengths: ["选项判断正确"],
      gaps: [],
      advice: "继续训练",
      dimensionScores: [{ key: "ai_boundary", label: "答案解析", score: 100, maxScore: 100, evidence: "选择正确", advice: "继续练习" }]
    });

    expect(rows[0]).toMatchObject({ ability_key: "ai_boundary", score: 20, max_score: 20 });
  });
});
