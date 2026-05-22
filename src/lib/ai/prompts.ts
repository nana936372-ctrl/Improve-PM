import { ABILITY_DIMENSIONS, type AbilityKey } from "@/lib/constants/abilities";
import type { Difficulty, QuestionType } from "@/lib/types/training";

const rubricText = ABILITY_DIMENSIONS.map((item) => `${item.key}: ${item.label} - ${item.description}`).join("\n");

export function buildQuestionPrompt(input: {
  questionType: QuestionType;
  abilityKeys: AbilityKey[];
  difficulty: Difficulty;
  scenePreference?: string;
}) {
  return [
    {
      role: "system" as const,
      content: "你是严格的 AI 产品经理训练教练。只输出合法 JSON，不要输出 Markdown。"
    },
    {
      role: "user" as const,
      content: `生成一道 AI 产品经理训练题。
题型：${input.questionType}
能力维度：${input.abilityKeys.join(", ")}
难度：${input.difficulty}
场景偏好：${input.scenePreference || "AI 产品经理通用业务场景"}

能力维度定义：
${rubricText}

JSON 字段必须包含：type,title,prompt,abilityKeys,difficulty。
选择题必须包含 options 和 correctOptions。
案例题必须包含 scenario 和 rubric。`
    }
  ];
}

export function buildEvaluationPrompt(input: { question: unknown; answer: unknown }) {
  return [
    {
      role: "system" as const,
      content: "你是严格的 AI 产品经理面试官。根据 Rubric 评分，只输出合法 JSON。"
    },
    {
      role: "user" as const,
      content: `请评估用户答案。
题目：${JSON.stringify(input.question)}
用户答案：${JSON.stringify(input.answer)}

输出 JSON 字段：overallScore,dimensionScores,strengths,gaps,advice,optionAnalysis,followupQuestion。`
    }
  ];
}

export function buildFollowupPrompt(input: { question: unknown; evaluation: unknown; previousAnswers: unknown[] }) {
  return [
    { role: "system" as const, content: "你是 AI 产品经理面试官。只输出一个高质量追问的 JSON。" },
    {
      role: "user" as const,
      content: `基于以下上下文生成追问。
题目：${JSON.stringify(input.question)}
评分：${JSON.stringify(input.evaluation)}
历史追问回答：${JSON.stringify(input.previousAnswers)}

输出 JSON 字段：question,intent,expectedSupplement。`
    }
  ];
}

export function buildReferenceAnswerPrompt(input: { question: unknown; answer: unknown; evaluation: unknown; followups: unknown[] }) {
  return [
    { role: "system" as const, content: "你是 AI 产品经理训练导师。只输出合法 JSON。" },
    {
      role: "user" as const,
      content: `生成参考答案和复盘建议。
题目：${JSON.stringify(input.question)}
用户答案：${JSON.stringify(input.answer)}
评分：${JSON.stringify(input.evaluation)}
追问：${JSON.stringify(input.followups)}

输出 JSON 字段：outline,sampleAnswer,commonMistakes,nextTrainingAdvice。`
    }
  ];
}
