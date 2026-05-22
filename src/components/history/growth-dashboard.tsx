type SessionRow = {
  id: string;
  title: string;
  question_type: string;
  overall_score: number | null;
  completed_at: string | null;
};

type SnapshotRow = {
  ability_key: string;
  score: number;
  max_score: number;
  created_at: string;
};

export function GrowthDashboard({ sessions, snapshots }: { sessions: SessionRow[]; snapshots: SnapshotRow[] }) {
  if (sessions.length === 0) {
    return <div className="rounded-lg border border-line bg-white p-6 text-muted">还没有训练记录。完成一次训练后，这里会显示趋势。</div>;
  }

  const average = Math.round(sessions.reduce((sum, item) => sum + (item.overall_score ?? 0), 0) / sessions.length);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="rounded-lg border border-line bg-white p-5">
        <p className="text-sm text-muted">平均分</p>
        <div className="mt-2 text-4xl font-semibold text-ink">{average}</div>
        <p className="mt-2 text-sm text-muted">共 {sessions.length} 次训练</p>
      </section>
      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold text-ink">最近训练</h2>
        <div className="mt-4 grid gap-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded border border-line p-3">
              <div>
                <p className="font-medium">{session.title}</p>
                <p className="text-sm text-muted">{session.question_type}</p>
              </div>
              <span className="text-lg font-semibold">{session.overall_score ?? "-"}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-line bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold text-ink">能力快照</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {snapshots.slice(0, 12).map((snapshot, index) => (
            <div key={`${snapshot.ability_key}-${index}`} className="rounded border border-line p-3">
              <div className="flex justify-between text-sm">
                <span>{snapshot.ability_key}</span>
                <span>
                  {snapshot.score}/{snapshot.max_score}
                </span>
              </div>
              <div className="mt-2 h-2 rounded bg-panel">
                <div className="h-2 rounded bg-brand" style={{ width: `${(snapshot.score / snapshot.max_score) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
