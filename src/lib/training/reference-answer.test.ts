import { describe, expect, it } from "vitest";

import { buildChoiceReferenceAnswer } from "./reference-answer";

describe("buildChoiceReferenceAnswer", () => {
  it("explains a single-choice answer through PM decision factors", () => {
    const referenceAnswer = buildChoiceReferenceAnswer({
      question: {
        type: "single_choice",
        title: "AI 能力边界判断",
        prompt: "AI 客服能否完全替代人工？",
        options: [
          { id: "A", text: "AI 可以完美处理所有类型咨询，无需人工介入" },
          { id: "B", text: "AI 可以处理标准化、高频重复咨询，但复杂、个性化或涉及情感理解的咨询仍需人工" },
          { id: "C", text: "AI 只能处理简单的是非问题，无法处理任何开放性问题" },
          { id: "D", text: "AI 的能力只取决于工程师编码质量，与模型本身无关" }
        ],
        correctOptions: ["B"],
        abilityKeys: ["ai_boundary"],
        difficulty: "intermediate"
      },
      evaluation: {
        overallScore: 80,
        dimensionScores: [
          {
            key: "ai_boundary",
            score: 16,
            maxScore: 20,
            evidence: "用户选择了 B。",
            advice: "补充标准化咨询与复杂咨询的边界。"
          }
        ],
        strengths: [],
        gaps: [],
        advice: "继续训练。"
      }
    });

    expect(referenceAnswer.outline).toContain("更优选项：B");
    expect(referenceAnswer.sampleAnswer).toContain("标准化、高频重复咨询");
    expect(referenceAnswer.sampleAnswer).toContain("PM 需要考虑");
    expect(referenceAnswer.sampleAnswer).toContain("人工兜底");
    expect(referenceAnswer.commonMistakes).toContain("只用能不能替代人工做二元判断，忽略场景复杂度和风险分层。");
  });
});
