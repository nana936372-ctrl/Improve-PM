import { describe, expect, it } from "vitest";

import { scoreChoiceAnswer } from "./choice";

describe("scoreChoiceAnswer", () => {
  it("scores exact single choice", () => {
    expect(scoreChoiceAnswer({ selectedOptions: ["A"], correctOptions: ["A"] })).toBe(100);
  });

  it("penalizes wrong options in multiple choice", () => {
    expect(scoreChoiceAnswer({ selectedOptions: ["A", "C"], correctOptions: ["A", "B"] })).toBe(0);
  });

  it("gives partial credit for missing correct options", () => {
    expect(scoreChoiceAnswer({ selectedOptions: ["A"], correctOptions: ["A", "B"] })).toBe(50);
  });
});
