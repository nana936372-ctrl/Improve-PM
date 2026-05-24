import { scoreChoiceAnswer } from "@/lib/scoring/choice";
import type { EvaluationResult, TrainingQuestion } from "@/lib/types/training";

function selectedOptionId(selectedOptions: string[]) {
  return selectedOptions[0] ?? "未选择";
}

function optionText(question: TrainingQuestion, optionId: string) {
  return question.options?.find((option) => option.id === optionId)?.text ?? optionId;
}

function formatOption(question: TrainingQuestion, optionId: string) {
  return optionId === "未选择" ? optionId : `${optionId}. ${optionText(question, optionId)}`;
}

function formatCorrectAnswer(question: TrainingQuestion) {
  return question.correctOptions?.map((optionId) => formatOption(question, optionId)).join("；") || "题目未提供标准答案。";
}

export function buildSingleChoiceEvaluation({
  question,
  selectedOptions
}: {
  question: TrainingQuestion;
  selectedOptions: string[];
}): EvaluationResult {
  const correctOptions = question.correctOptions ?? [];
  const selected = selectedOptionId(selectedOptions);
  const score = scoreChoiceAnswer({ selectedOptions: selectedOptions.slice(0, 1), correctOptions, maxScore: 100 });
  const correctIds = correctOptions.join("、") || "未提供";
  const selectedLine = selected === "未选择" ? "你还没有选择答案。" : `你选择的是 ${formatOption(question, selected)}。`;

  return {
    overallScore: score,
    dimensionScores: [
      {
        key: question.abilityKeys[0] ?? "single_choice",
        label: "答案解析",
        score,
        maxScore: 100,
        evidence: `${selectedLine} 更优答案是 ${correctIds}：${formatCorrectAnswer(question)}`,
        advice:
          "PM 需要考虑题干中的业务目标、输入数据是否足够结构化、LLM 擅长与不擅长的任务边界、错误风险、人工审核或兜底机制，以及后续用哪些指标验证方案效果。"
      }
    ],
    strengths: score === 100 ? ["选项判断正确"] : [],
    gaps: score === 100 ? [] : ["选项判断需要回到题干中的 AI 能力边界与产品风险。"],
    advice: "单选题评分重点是解释题目和选项取舍，不做多维 Rubric 扣分。",
    optionAnalysis: {
      selected,
      correct: correctIds
    }
  };
}
