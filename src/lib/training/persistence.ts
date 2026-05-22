import type { EvaluationResult } from "@/lib/types/training";

export function buildAbilitySnapshots(sessionId: string, userId: string, evaluation: EvaluationResult) {
  return evaluation.dimensionScores.map((score) => ({
    session_id: sessionId,
    user_id: userId,
    ability_key: score.key,
    score: score.score,
    max_score: score.maxScore
  }));
}
