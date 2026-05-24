import type { AbilityKey } from "@/lib/constants/abilities";

export type QuestionType = "single_choice" | "multiple_choice" | "case_analysis";
export type TrainingStatus = "draft" | "generated" | "answered" | "evaluated" | "completed";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ChoiceOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
};

export type DimensionScore = {
  key: string;
  label?: string;
  score: number;
  maxScore: number;
  evidence: string;
  advice: string;
};

export type TrainingQuestion = {
  type: QuestionType;
  title: string;
  prompt: string;
  scenario?: string;
  options?: ChoiceOption[];
  correctOptions?: string[];
  abilityKeys: AbilityKey[];
  difficulty: Difficulty;
  rubric?: string;
};

export type EvaluationResult = {
  overallScore: number;
  dimensionScores: DimensionScore[];
  strengths: string[];
  gaps: string[];
  advice: string;
  optionAnalysis?: Record<string, string>;
  followupQuestion?: string;
};
