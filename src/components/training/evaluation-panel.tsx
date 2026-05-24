import type { EvaluationResult } from "@/lib/types/training";

export function EvaluationPanel({ evaluation }: { evaluation: EvaluationResult | null }) {
  if (!evaluation) {
    return <aside className="rounded-lg border border-line bg-white p-5 text-sm text-muted">提交答案后显示评分与反馈。</aside>;
  }

  return (
    <aside className="rounded-lg border border-line bg-white p-5">
      <div className="text-sm text-muted">总分</div>
      <div className="mt-1 text-4xl font-semibold text-ink">{evaluation.overallScore}</div>
      <div className="mt-5 grid gap-3">
        {evaluation.dimensionScores.map((item) => (
          <div key={item.key} className="rounded border border-line p-3">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{item.label ?? item.key}</span>
              <span>
                {item.score}/{item.maxScore}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{item.evidence}</p>
            <p className="mt-2 text-sm text-brand">{item.advice}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
