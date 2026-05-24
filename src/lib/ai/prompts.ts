import { ABILITY_DIMENSIONS, type AbilityKey } from "@/lib/constants/abilities";
import type { Difficulty, QuestionType } from "@/lib/types/training";

const rubricText = ABILITY_DIMENSIONS.map((item) => `${item.key}: ${item.label} - ${item.description}`).join("\n");
const evaluationScoringPrinciples = `评分原则：
每个评分维度按 0-20 分，maxScore 固定为 20。
17-20：准确识别核心问题，分析有层次，方案可落地，能说明指标、风险和取舍。
13-16：覆盖主要问题，但论证、指标或风险处理不够充分。
8-12：有部分正确判断，但停留在概念层，缺少业务约束、落地路径或验证方式。
0-7：偏离题意、缺少关键判断，或只给空泛结论。
dimensionScores 中每一项必须包含 key, score, maxScore, evidence, advice。
dimensionScores.key 只能使用以下官方能力 key：${ABILITY_DIMENSIONS.map((item) => item.key).join(", ")}，不要自创英文 key 或中文短标签。
evidence 必须引用用户答案中的具体内容作为 evidence，不能写“AI 未提供该维度的具体依据”。
advice 必须给出可执行改进动作，例如补充哪类指标、风险兜底、灰度验证、业务沟通或方案分层。`;

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
选择题必须包含 options 和 correctOptions；options 必须是数组，格式如 options:[{"id":"A","text":"选项文案"}]，id 只能使用 A/B/C/D，不能使用 label。
多选题必须有 4 个选项，correctOptions 必须包含 2 到 3 个选项，不能只有一个明显正面选项、其余都是明显错误项。
多选题每个选项都要像真实 PM 决策中的可争议判断，覆盖合理做法、过度自动化、过度保守、忽略风险、指标缺失、边界误判等不同类型。
多选题选项避免使用绝对化词汇堆叠，例如“完全、所有、无需、只要、一定、必然”，除非该词正是要考察的错误边界。
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

${evaluationScoringPrinciples}

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
