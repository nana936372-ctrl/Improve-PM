import { describe, expect, it } from "vitest";

import { evaluationSchema, generatedQuestionSchema } from "./schemas";

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

  it("requires multiple-choice questions to have four options and two to three correct answers", () => {
    expect(() =>
      generatedQuestionSchema.parse({
        type: "multiple_choice",
        title: "AI 能力边界判断",
        prompt: "哪些判断合理？",
        options: [
          { id: "A", text: "先结构化输入数据。" },
          { id: "B", text: "加入人工复核。" },
          { id: "C", text: "完全依赖模型。" },
          { id: "D", text: "只看自动化率。" }
        ],
        correctOptions: ["A"],
        abilityKeys: ["ai_boundary"],
        difficulty: "intermediate"
      })
    ).toThrow();

    const result = generatedQuestionSchema.parse({
      type: "multiple_choice",
      title: "AI 能力边界判断",
      prompt: "哪些判断合理？",
      options: [
        { id: "A", text: "先结构化输入数据。" },
        { id: "B", text: "加入人工复核。" },
        { id: "C", text: "完全依赖模型。" },
        { id: "D", text: "只看自动化率。" }
      ],
      correctOptions: ["A", "B"],
      abilityKeys: ["ai_boundary"],
      difficulty: "intermediate"
    });

    expect(result.correctOptions).toEqual(["A", "B"]);
  });

  it("normalizes choice option labels into ids", () => {
    const result = generatedQuestionSchema.parse({
      type: "single_choice",
      title: "用户行为分析",
      prompt: "某 AI 产品上线后，哪项最可能导致用户活跃度低？",
      options: [
        { label: "A", text: "模型准确率不够高" },
        { label: "B", text: "用户引导流程缺失或复杂" }
      ],
      correctOptions: ["B"],
      abilityKeys: ["user_insight"],
      difficulty: "beginner"
    });

    expect(result.options).toEqual([
      { id: "A", text: "模型准确率不够高" },
      { id: "B", text: "用户引导流程缺失或复杂" }
    ]);
  });

  it("normalizes object rubrics into text", () => {
    const result = generatedQuestionSchema.parse({
      type: "case_analysis",
      title: "AI 客服质检",
      prompt: "请设计一个 AI 客服质检方案。",
      scenario: "客服主管希望降低人工质检成本。",
      abilityKeys: ["ai_boundary"],
      difficulty: "intermediate",
      rubric: {
        user_insight: "能说明用户和业务目标",
        ai_boundary: "能识别模型能力边界和失败风险"
      }
    });

    expect(result.rubric).toContain("ai_boundary");
  });

  it("normalizes object scenarios into text", () => {
    const result = generatedQuestionSchema.parse({
      type: "case_analysis",
      title: "AI 客服质检",
      prompt: "请设计一个 AI 客服质检方案。",
      scenario: {
        background: "客服主管希望降低人工质检成本。",
        constraint: "不能降低高风险投诉识别率。"
      },
      abilityKeys: ["ai_boundary"],
      difficulty: "intermediate"
    });

    expect(result.scenario).toContain("background");
    expect(result.scenario).toContain("高风险投诉");
  });
});

describe("evaluationSchema", () => {
  it("normalizes common model response variants", () => {
    const result = evaluationSchema.parse({
      overallScore: 82.6,
      dimensionScores: {
        ai_boundary: {
          score: 16.4,
          maxScore: 20,
          evidence: "识别了模型能力边界。",
          advice: "补充失败兜底策略。"
        }
      },
      strengths: ["结构清晰"],
      gaps: ["实验设计略弱"],
      advice: "继续强化指标设计。",
      optionAnalysis: "案例题无选项分析"
    });

    expect(result.overallScore).toBe(83);
    expect(result.dimensionScores).toEqual([
      {
        key: "ai_boundary",
        score: 16,
        maxScore: 20,
        evidence: "识别了模型能力边界。",
        advice: "补充失败兜底策略。"
      }
    ]);
    expect(result.optionAnalysis).toEqual({ summary: "案例题无选项分析" });
  });

  it("normalizes shorthand numeric dimension scores", () => {
    const result = evaluationSchema.parse({
      overallScore: 78,
      dimensionScores: {
        ai_boundary: 15,
        risk_governance: 13
      },
      strengths: ["考虑了边界"],
      gaps: ["治理细节不足"],
      advice: "补充风险策略。",
      optionAnalysis: null
    });

    expect(result.dimensionScores).toEqual([
      {
        key: "ai_boundary",
        score: 15,
        maxScore: 20,
        evidence: "AI 未提供该维度的具体依据。",
        advice: "建议补充该维度的分析。"
      },
      {
        key: "risk_governance",
        score: 13,
        maxScore: 20,
        evidence: "AI 未提供该维度的具体依据。",
        advice: "建议补充该维度的分析。"
      }
    ]);
    expect(result.optionAnalysis).toBeUndefined();
  });

  it("accepts custom evaluation dimension keys and object option analysis values", () => {
    const result = evaluationSchema.parse({
      overallScore: 81,
      dimensionScores: {
        risk_awareness: {
          score: 14,
          maxScore: 20,
          evidence: "说明了直接使用的限制。",
          advice: "补充灰度验证。"
        }
      },
      strengths: [],
      gaps: [],
      advice: "继续训练。",
      optionAnalysis: {
        directUse: { pros: "上线快", cons: "风险高" }
      }
    });

    expect(result.dimensionScores[0].key).toBe("risk_governance");
    expect(result.optionAnalysis?.directUse).toContain("上线快");
  });

  it("rejects unknown evaluation dimension keys to prevent polluted ability snapshots", () => {
    expect(() =>
      evaluationSchema.parse({
        overallScore: 81,
        dimensionScores: {
          totally_custom_dimension: {
            score: 14,
            maxScore: 20,
            evidence: "随意造的维度。",
            advice: "不应入库。"
          }
        },
        strengths: [],
        gaps: [],
        advice: "继续训练。"
      })
    ).toThrow();
  });

  it("scales oversized dimension scores and wraps text lists", () => {
    const result = evaluationSchema.parse({
      overallScore: 84,
      dimensionScores: {
        ai_boundary: {
          score: 80,
          maxScore: 100,
          evidence: "能识别边界。",
          advice: "继续补充验证。"
        }
      },
      strengths: "分析结构清楚",
      gaps: "风险治理不够具体",
      advice: "补充治理方案。"
    });

    expect(result.dimensionScores[0].score).toBe(16);
    expect(result.dimensionScores[0].maxScore).toBe(20);
    expect(result.strengths).toEqual(["分析结构清楚"]);
    expect(result.gaps).toEqual(["风险治理不够具体"]);
  });

  it("normalizes numeric dimension score arrays", () => {
    const result = evaluationSchema.parse({
      overallScore: 76,
      dimensionScores: [80, 65],
      strengths: [],
      gaps: [],
      advice: "继续训练。"
    });

    expect(result.dimensionScores).toEqual([
      {
        key: "user_insight",
        score: 16,
        maxScore: 20,
        evidence: "AI 未提供该维度的具体依据。",
        advice: "建议补充该维度的分析。"
      },
      {
        key: "problem_framing",
        score: 13,
        maxScore: 20,
        evidence: "AI 未提供该维度的具体依据。",
        advice: "建议补充该维度的分析。"
      }
    ]);
  });

  it("normalizes array option analysis into a summary", () => {
    const result = evaluationSchema.parse({
      overallScore: 80,
      dimensionScores: [],
      strengths: [],
      gaps: [],
      advice: "继续训练。",
      optionAnalysis: ["A 方案风险较高", { option: "B", note: "更稳妥" }]
    });

    expect(result.optionAnalysis?.summary).toContain("A 方案风险较高");
    expect(result.optionAnalysis?.summary).toContain("更稳妥");
  });
});
