import { describe, expect, it, vi } from "vitest";

import { POST as evaluate } from "./evaluate/route";
import { POST as followup } from "./followup/route";
import { POST as generateQuestion } from "./generate-question/route";
import { POST as referenceAnswer } from "./reference-answer/route";
import { createChatCompletion } from "@/lib/ai/client";

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

  it("evaluates single-choice answers as an answer explanation without calling the AI provider", async () => {
    vi.mocked(createChatCompletion).mockClear();

    const response = await evaluate(
      jsonRequest({
        question: {
          type: "single_choice",
          title: "AI 能力边界判断：用户画像生成",
          prompt: "哪种做法最符合 AI 能力边界？",
          options: [
            { id: "A", text: "直接使用 LLM 分析原始日志。" },
            { id: "B", text: "先将日志转换为结构化特征，再输入 LLM 生成描述。" },
            { id: "C", text: "让 LLM 自行设计特征工程和预处理流程。" },
            { id: "D", text: "完全依赖 LLM，不需要人工审核。" }
          ],
          correctOptions: ["B"],
          abilityKeys: ["ai_boundary"],
          difficulty: "intermediate"
        },
        answer: { selectedOptions: ["B"] }
      })
    );
    const body = await response.json();

    expect(createChatCompletion).not.toHaveBeenCalled();
    expect(body.evaluation.overallScore).toBe(100);
    expect(body.evaluation.dimensionScores).toHaveLength(1);
    expect(body.evaluation.dimensionScores[0]).toMatchObject({
      key: "ai_boundary",
      label: "答案解析",
      score: 100,
      maxScore: 100
    });
    expect(body.evaluation.dimensionScores[0].evidence).toContain("更优答案是 B");
    expect(body.evaluation.dimensionScores[0].evidence).toContain("先将日志转换为结构化特征");
    expect(body.evaluation.dimensionScores[0].advice).toContain("PM 需要考虑");
    expect(body.evaluation.dimensionScores[0].advice).not.toContain("只选择");
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

  it("creates choice reference answers without calling the AI provider", async () => {
    vi.mocked(createChatCompletion).mockClear();

    const response = await referenceAnswer(
      jsonRequest({
        question: {
          type: "single_choice",
          title: "AI 能力边界判断",
          prompt: "AI 客服能否完全替代人工？",
          options: [
            { id: "A", text: "AI 可以完美处理所有类型咨询，无需人工介入" },
            { id: "B", text: "AI 可以处理标准化、高频重复咨询，但复杂咨询仍需人工" }
          ],
          correctOptions: ["B"],
          abilityKeys: ["ai_boundary"],
          difficulty: "intermediate"
        },
        answer: { selectedOptions: ["B"] },
        evaluation: {
          overallScore: 80,
          dimensionScores: [
            {
              key: "ai_boundary",
              score: 16,
              maxScore: 20,
              evidence: "用户选择了 B。",
              advice: "补充复杂咨询的边界。"
            }
          ],
          strengths: [],
          gaps: [],
          advice: "继续训练。"
        }
      })
    );
    const body = await response.json();

    expect(createChatCompletion).not.toHaveBeenCalled();
    expect(body.referenceAnswer.outline).toContain("更优选项：B");
    expect(body.referenceAnswer.sampleAnswer).toContain("PM 需要考虑");
    expect(body.referenceAnswer.sampleAnswer).toContain("人工兜底");
  });
});
