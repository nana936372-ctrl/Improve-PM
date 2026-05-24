import { ABILITY_DIMENSIONS } from "@/lib/constants/abilities";
import type { EvaluationResult, TrainingQuestion } from "@/lib/types/training";

export type ReferenceAnswer = {
  outline: string[];
  sampleAnswer: string;
  commonMistakes: string[];
  nextTrainingAdvice: string;
};

const abilityLabels = new Map(ABILITY_DIMENSIONS.map((item) => [item.key, item.label]));

function formatOptionIds(options: string[]) {
  return options.length ? options.join("、") : "未提供";
}

function optionText(question: TrainingQuestion, optionId: string) {
  return question.options?.find((option) => option.id === optionId)?.text ?? optionId;
}

function formatCorrectOptions(question: TrainingQuestion) {
  return (question.correctOptions ?? []).map((optionId) => `${optionId}. ${optionText(question, optionId)}`).join("\n");
}

function formatAbilityFocus(question: TrainingQuestion) {
  return question.abilityKeys.map((key) => abilityLabels.get(key) ?? key).join("、");
}

export function buildChoiceReferenceAnswer({
  question,
  evaluation
}: {
  question: TrainingQuestion;
  evaluation: EvaluationResult;
}): ReferenceAnswer {
  const correctOptions = question.correctOptions ?? [];
  const correctOptionText = formatCorrectOptions(question);
  const selectedEvidence = evaluation.dimensionScores.map((score) => score.evidence).filter(Boolean).join(" ");
  const improvementAdvice = evaluation.dimensionScores.map((score) => score.advice).filter(Boolean).join(" ");

  return {
    outline: [
      `更优选项：${formatOptionIds(correctOptions)}`,
      `考察维度：${formatAbilityFocus(question)}`,
      "判断框架：先看业务场景是否标准化，再看 AI 能力边界、风险等级、人工兜底和指标验证。"
    ],
    sampleAnswer: `本题更优答案是 ${formatOptionIds(correctOptions)}。
${correctOptionText}

作为 PM，不能只判断 AI 能不能替代人工，而要拆成几个因素：咨询是否标准化、高频重复，是否需要个性化判断或情绪理解，错误答案会不会带来投诉、合规或安全风险，模型是否有置信度和拒答机制，以及何时必须转人工兜底。对 AI 客服这类场景，标准化、高频重复咨询适合优先自动化；复杂、个性化、争议性或涉及情感安抚的问题，应保留人工介入和升级机制。

PM 需要考虑的验证方式包括一次解决率、转人工率、用户满意度、误答率、投诉率和人工复核成本。${selectedEvidence ? `本次作答反馈中提到：${selectedEvidence}` : ""}${improvementAdvice ? ` 下一步可以：${improvementAdvice}` : ""}`,
    commonMistakes: [
      "只用能不能替代人工做二元判断，忽略场景复杂度和风险分层。",
      "只看模型能力，不设计置信度、拒答、转人工和复核机制。",
      "只追求自动化率，忽略用户体验、投诉风险和质量指标。"
    ],
    nextTrainingAdvice: "继续练习把 AI 能力边界拆成场景类型、失败风险、人工兜底和可验证指标，而不是停留在单个正确选项。"
  };
}
