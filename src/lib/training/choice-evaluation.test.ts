import { describe, expect, it } from "vitest";

import { buildSingleChoiceEvaluation } from "./choice-evaluation";

describe("buildSingleChoiceEvaluation", () => {
  it("explains an incorrect single-choice answer without rubric-style multi-dimensional scoring", () => {
    const evaluation = buildSingleChoiceEvaluation({
      question: {
        type: "single_choice",
        title: "AI 能力边界判断",
        prompt: "哪种做法最符合 AI 能力边界？",
        options: [
          { id: "A", text: "直接使用 LLM 分析原始日志。" },
          { id: "B", text: "先将日志转换为结构化特征，再输入 LLM 生成描述。" }
        ],
        correctOptions: ["B"],
        abilityKeys: ["ai_boundary"],
        difficulty: "intermediate"
      },
      selectedOptions: ["A"]
    });

    expect(evaluation.overallScore).toBe(0);
    expect(evaluation.dimensionScores).toHaveLength(1);
    expect(evaluation.dimensionScores[0].label).toBe("答案解析");
    expect(evaluation.dimensionScores[0].evidence).toContain("你选择的是 A");
    expect(evaluation.dimensionScores[0].evidence).toContain("更优答案是 B");
    expect(evaluation.dimensionScores[0].advice).toContain("PM 需要考虑");
  });
});
