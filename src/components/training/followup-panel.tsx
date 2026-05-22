export type FollowupTurn = {
  question: string;
  intent?: string;
  answer?: string;
};

export function FollowupPanel({ turns }: { turns: FollowupTurn[] }) {
  if (turns.length === 0) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h3 className="font-semibold text-ink">AI 面试官追问</h3>
      <div className="mt-4 grid gap-3">
        {turns.map((turn, index) => (
          <div key={`${turn.question}-${index}`} className="rounded border border-line p-3">
            <p className="text-sm font-medium">
              第 {index + 1} 轮：{turn.question}
            </p>
            {turn.intent ? <p className="mt-2 text-sm text-muted">追问意图：{turn.intent}</p> : null}
            {turn.answer ? <p className="mt-2 text-sm text-ink">回答：{turn.answer}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
