import { describe, expect, it, vi } from "vitest";

import { POST as evaluate } from "./evaluate/route";
import { POST as followup } from "./followup/route";
import { POST as generateQuestion } from "./generate-question/route";
import { POST as referenceAnswer } from "./reference-answer/route";

vi.mock("@/lib/auth/guards", () => ({
  requireUser: vi.fn(async () => ({ id: "user-1" }))
}));

vi.mock("@/lib/ai/client", () => ({
  createChatCompletion: vi.fn(async (messages: { content: string }[]) => {
    const prompt = messages.map((message) => message.content).join("\n");
    if (prompt.includes("生成一道")) {
      return JSON.stringify({
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
    }
    if (prompt.includes("请评估")) {
      return JSON.stringify({
        overallScore: 80,
        dimensionScores: [
          {
            key: "metrics_experiment",
            score: 16,
            maxScore: 20,
            evidence: "覆盖核心指标",
            advice: "补充实验设计"
          }
        ],
        strengths: ["指标意识清晰"],
        gaps: ["实验路径不足"],
        advice: "增加 A/B 评估"
      });
    }
    if (prompt.includes("生成追问")) {
      return JSON.stringify({
        question: "你会如何验证指标提升来自方案本身？",
        intent: "考察实验设计",
        expectedSupplement: "补充对照组和观测窗口"
      });
    }
    return JSON.stringify({
      outline: ["目标", "方案", "指标"],
      sampleAnswer: "先定义业务目标，再设计 AI 方案。",
      commonMistakes: ["只讲模型能力"],
      nextTrainingAdvice: "继续练习指标和实验设计"
    });
  })
}));

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

describe("AI API routes", () => {
  it("generates a validated question", async () => {
    const response = await generateQuestion(
      jsonRequest({
        questionType: "single_choice",
        abilityKeys: ["metrics_experiment"],
        difficulty: "beginner"
      })
    );
    const body = await response.json();
    expect(body.question.title).toBe("指标选择");
  });

  it("evaluates an answer", async () => {
    const response = await evaluate(jsonRequest({ question: { title: "题" }, answer: { selectedOptions: ["A"] } }));
    const body = await response.json();
    expect(body.evaluation.overallScore).toBe(80);
  });

  it("creates a follow-up question", async () => {
    const response = await followup(jsonRequest({ question: {}, evaluation: {} }));
    const body = await response.json();
    expect(body.followup.intent).toBe("考察实验设计");
  });

  it("creates a reference answer", async () => {
    const response = await referenceAnswer(jsonRequest({ question: {}, answer: {}, evaluation: {} }));
    const body = await response.json();
    expect(body.referenceAnswer.outline).toContain("目标");
  });
});
