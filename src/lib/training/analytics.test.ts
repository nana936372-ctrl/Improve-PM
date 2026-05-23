import { describe, expect, it } from "vitest";

import { summarizeAbilitySnapshots } from "./analytics";

describe("summarizeAbilitySnapshots", () => {
  it("groups snapshots by ability and calculates average latest and trend", () => {
    const summaries = summarizeAbilitySnapshots([
      { ability_key: "ai_boundary", score: 12, max_score: 20, created_at: "2026-05-22T10:00:00Z" },
      { ability_key: "ai_boundary", score: 16, max_score: 20, created_at: "2026-05-23T10:00:00Z" },
      { ability_key: "metrics_experiment", score: 8, max_score: 20, created_at: "2026-05-23T09:00:00Z" }
    ]);

    expect(summaries).toEqual([
      {
        abilityKey: "ai_boundary",
        averageScore: 14,
        averagePercent: 70,
        latestScore: 16,
        latestMaxScore: 20,
        latestPercent: 80,
        count: 2,
        trend: "up"
      },
      {
        abilityKey: "metrics_experiment",
        averageScore: 8,
        averagePercent: 40,
        latestScore: 8,
        latestMaxScore: 20,
        latestPercent: 40,
        count: 1,
        trend: "new"
      }
    ]);
  });

  it("marks a lower latest score as a downward trend", () => {
    const [summary] = summarizeAbilitySnapshots([
      { ability_key: "solution_tradeoff", score: 10, max_score: 20, created_at: "2026-05-23T10:00:00Z" },
      { ability_key: "solution_tradeoff", score: 14, max_score: 20, created_at: "2026-05-22T10:00:00Z" }
    ]);

    expect(summary.trend).toBe("down");
  });
});
