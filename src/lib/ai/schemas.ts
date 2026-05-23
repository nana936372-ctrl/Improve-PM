import { z } from "zod";

import { ABILITY_KEYS, type AbilityKey } from "@/lib/constants/abilities";

const abilityKeySchema = z.custom<AbilityKey>((value) => typeof value === "string" && (ABILITY_KEYS as readonly string[]).includes(value));
const evaluationDimensionKeySchema = z.string().min(1);
const structuredTextSchema = z.preprocess((value) => {
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return value;
}, z.string());
const integerScoreSchema = z.preprocess((value) => {
  if (typeof value === "number") {
    return Math.round(value);
  }
  return value;
}, z.number().int());
const dimensionScoreValueSchema = z.preprocess((value) => {
  if (typeof value === "number") {
    const rounded = Math.round(value);
    return rounded > 20 ? Math.min(20, Math.round(rounded / 5)) : Math.max(0, rounded);
  }
  return value;
}, z.number().int().min(0).max(20));
const dimensionMaxScoreSchema = z.preprocess((value) => {
  if (typeof value === "number") {
    const rounded = Math.round(value);
    return rounded > 20 ? 20 : Math.max(1, rounded);
  }
  return value;
}, z.number().int().min(1).max(20));
const stringListSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return [value];
  }
  return value;
}, z.array(z.string()));
const dimensionScoresSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      item && typeof item === "object"
        ? item
        : {
            key: `dimension_${index + 1}`,
            score: item,
            maxScore: 20,
            evidence: "AI 未提供该维度的具体依据。",
            advice: "建议补充该维度的分析。"
          }
    );
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).map(([key, item]) =>
      item && typeof item === "object"
        ? { key, ...item }
        : {
            key,
            score: item,
            maxScore: 20,
            evidence: "AI 未提供该维度的具体依据。",
            advice: "建议补充该维度的分析。"
          }
    );
  }
  return value;
}, z.array(
  z.object({
    key: evaluationDimensionKeySchema,
    score: dimensionScoreValueSchema,
    maxScore: dimensionMaxScoreSchema,
    evidence: z.string().min(1),
    advice: z.string().min(1)
  })
));
const optionAnalysisSchema = z.preprocess((value) => {
  if (value === null) {
    return undefined;
  }
  if (typeof value === "string") {
    return { summary: value };
  }
  if (Array.isArray(value)) {
    return {
      summary: value
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item, null, 2) ?? String(item)))
        .join("\n")
    };
  }
  return value;
}, z.record(z.preprocess((value) => {
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return value;
}, z.string())).optional());

const choiceOptionIdSchema = z.enum(["A", "B", "C", "D"]);

export const choiceOptionSchema = z.preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const option = value as Record<string, unknown>;
    if (!option.id && typeof option.label === "string") {
      return { ...option, id: option.label };
    }
  }
  return value;
}, z.object({
  id: choiceOptionIdSchema,
  text: z.string().min(1)
}));

export const generatedQuestionSchema = z.object({
  type: z.enum(["single_choice", "multiple_choice", "case_analysis"]),
  title: z.string().min(1),
  prompt: z.string().min(1),
  scenario: structuredTextSchema.optional(),
  options: z.array(choiceOptionSchema).optional(),
  correctOptions: z.array(choiceOptionIdSchema).optional(),
  abilityKeys: z.array(abilityKeySchema).min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  rubric: structuredTextSchema.optional()
});

export const evaluationSchema = z.object({
  overallScore: integerScoreSchema.pipe(z.number().min(0).max(100)),
  dimensionScores: dimensionScoresSchema,
  strengths: stringListSchema,
  gaps: stringListSchema,
  advice: z.string().min(1),
  optionAnalysis: optionAnalysisSchema,
  followupQuestion: z.string().optional()
});

export const followupSchema = z.object({
  question: z.string().min(1),
  intent: z.string().min(1),
  expectedSupplement: z.string().min(1)
});

export const referenceAnswerSchema = z.object({
  outline: z.array(z.string()).min(1),
  sampleAnswer: z.string().min(1),
  commonMistakes: z.array(z.string()),
  nextTrainingAdvice: z.string().min(1)
});
