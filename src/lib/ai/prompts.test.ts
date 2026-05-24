import { describe, expect, it } from "vitest";

import { buildEvaluationPrompt, buildQuestionPrompt } from "./prompts";

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

  it("spells out the choice option id/text shape", () => {
    const messages = buildQuestionPrompt({
      questionType: "single_choice",
      abilityKeys: ["user_insight"],
      difficulty: "beginner"
    });

    expect(messages[1].content).toContain('options:[{"id":"A","text":"');
  });

  it("adds strong multi-choice constraints to avoid one-obvious-positive options", () => {
    const messages = buildQuestionPrompt({
      questionType: "multiple_choice",
      abilityKeys: ["ai_boundary"],
      difficulty: "intermediate"
    });

    expect(messages[1].content).toContain("多选题必须有 4 个选项");
    expect(messages[1].content).toContain("correctOptions 必须包含 2 到 3 个选项");
    expect(messages[1].content).toContain("不能只有一个明显正面选项");
    expect(messages[1].content).toContain("每个选项都要像真实 PM 决策中的可争议判断");
    expect(messages[1].content).toContain("避免使用绝对化词汇");
  });

  it("includes concrete scoring principles in evaluation prompts", () => {
    const messages = buildEvaluationPrompt({
      question: { title: "AI 客服边界" },
      answer: { textAnswer: "需要人工兜底。" }
    });

    expect(messages[1].content).toContain("每个评分维度按 0-20 分");
    expect(messages[1].content).toContain("17-20");
    expect(messages[1].content).toContain("必须引用用户答案中的具体内容作为 evidence");
    expect(messages[1].content).toContain("advice 必须给出可执行改进动作");
  });
});
