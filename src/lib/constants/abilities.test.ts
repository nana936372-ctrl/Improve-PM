import { describe, expect, it } from "vitest";

import { normalizeAbilityKey } from "./abilities";

describe("normalizeAbilityKey", () => {
  it("maps common AI-generated dimension aliases to canonical ability keys", () => {
    expect(normalizeAbilityKey("understanding_ai_boundary")).toBe("ai_boundary");
    expect(normalizeAbilityKey("ai_boundary_understanding")).toBe("ai_boundary");
    expect(normalizeAbilityKey("risk_awareness")).toBe("risk_governance");
    expect(normalizeAbilityKey("user_experience_consideration")).toBe("user_insight");
    expect(normalizeAbilityKey("practicality_&_feasibility")).toBe("solution_tradeoff");
  });
});
