export type AbilitySnapshotInput = {
  ability_key: string;
  score: number;
  max_score: number;
  created_at: string;
};

export type AbilityTrend = "up" | "down" | "flat" | "new";

export type AbilitySnapshotSummary = {
  abilityKey: string;
  averageScore: number;
  averagePercent: number;
  latestScore: number;
  latestMaxScore: number;
  latestPercent: number;
  count: number;
  trend: AbilityTrend;
};

function toPercent(score: number, maxScore: number) {
  if (maxScore <= 0) return 0;
  return Math.round((score / maxScore) * 100);
}

function compareByCreatedDesc(a: AbilitySnapshotInput, b: AbilitySnapshotInput) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function trendFrom(latest: AbilitySnapshotInput, previous?: AbilitySnapshotInput): AbilityTrend {
  if (!previous) return "new";
  if (latest.score > previous.score) return "up";
  if (latest.score < previous.score) return "down";
  return "flat";
}

export function summarizeAbilitySnapshots(snapshots: AbilitySnapshotInput[]): AbilitySnapshotSummary[] {
  const grouped = new Map<string, AbilitySnapshotInput[]>();
  snapshots.forEach((snapshot) => {
    const current = grouped.get(snapshot.ability_key) ?? [];
    current.push(snapshot);
    grouped.set(snapshot.ability_key, current);
  });

  return Array.from(grouped.entries())
    .map(([abilityKey, rows]) => {
      const sorted = [...rows].sort(compareByCreatedDesc);
      const latest = sorted[0];
      const averageScore = Math.round(sorted.reduce((sum, row) => sum + row.score, 0) / sorted.length);
      const averageMaxScore = Math.round(sorted.reduce((sum, row) => sum + row.max_score, 0) / sorted.length);

      return {
        abilityKey,
        averageScore,
        averagePercent: toPercent(averageScore, averageMaxScore),
        latestScore: latest.score,
        latestMaxScore: latest.max_score,
        latestPercent: toPercent(latest.score, latest.max_score),
        count: sorted.length,
        trend: trendFrom(latest, sorted[1])
      };
    })
    .sort((a, b) => b.latestPercent - a.latestPercent);
}
