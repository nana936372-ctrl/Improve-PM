import { normalizeAbilityKey } from "@/lib/constants/abilities";
import type { EvaluationResult } from "@/lib/types/training";

const SNAPSHOT_MAX_SCORE = 20;

function toSnapshotScore(score: number, maxScore: number) {
  const sourceMaxScore = maxScore > 0 ? maxScore : SNAPSHOT_MAX_SCORE;
  const scaledScore = Math.round((score / sourceMaxScore) * SNAPSHOT_MAX_SCORE);
  return Math.max(0, Math.min(SNAPSHOT_MAX_SCORE, scaledScore));
}

export function buildAbilitySnapshots(sessionId: string, userId: string, evaluation: EvaluationResult) {
  return evaluation.dimensionScores.map((score) => ({
    session_id: sessionId,
    user_id: userId,
    ability_key: normalizeAbilityKey(score.key) ?? "solution_tradeoff",
    score: toSnapshotScore(score.score, score.maxScore),
    max_score: SNAPSHOT_MAX_SCORE
  }));
}
