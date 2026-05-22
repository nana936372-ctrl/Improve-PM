import { describe, expect, it } from "vitest";

import { generatedQuestionSchema } from "./schemas";

describe("generatedQuestionSchema", () => {
  it("accepts a valid choice question", () => {
    const result = generatedQuestionSchema.parse({
      type: "single_choice",
      title: "指标选择",
      prompt: "哪个指标最适合作为知识库问答的首要质量指标？",
      options: [
        { id: "A", text: "回答准确率" },
        { id: "B", text: "按钮点击率" }
      ],
      correctOptions: ["A"],
      abilityKeys: ["metrics_experiment"],
      difficulty: "beginner"
    });
    expect(result.correctOptions).toEqual(["A"]);
  });
});
