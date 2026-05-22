import { z } from "zod";

import { ABILITY_KEYS } from "@/lib/constants/abilities";

const abilityKeySchema = z.enum(ABILITY_KEYS as [string, ...string[]]);

export const choiceOptionSchema = z.object({
  id: z.enum(["A", "B", "C", "D"]),
  text: z.string().min(1)
});

export const generatedQuestionSchema = z.object({
  type: z.enum(["single_choice", "multiple_choice", "case_analysis"]),
  title: z.string().min(1),
  prompt: z.string().min(1),
  scenario: z.string().optional(),
  options: z.array(choiceOptionSchema).optional(),
  correctOptions: z.array(z.enum(["A", "B", "C", "D"])).optional(),
  abilityKeys: z.array(abilityKeySchema).min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  rubric: z.string().optional()
});

export const evaluationSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  dimensionScores: z.array(
    z.object({
      key: abilityKeySchema,
      score: z.number().int().min(0).max(20),
      maxScore: z.number().int().min(1).max(20),
      evidence: z.string().min(1),
      advice: z.string().min(1)
    })
  ),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  advice: z.string().min(1),
  optionAnalysis: z.record(z.string()).optional(),
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
