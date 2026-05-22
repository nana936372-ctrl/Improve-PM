export type FollowupTurn = {
  question: string;
  intent?: string;
  answer?: string;
};

export function FollowupPanel({
  turns,
  pendingAnswer,
  onAnswerChange,
  onSubmitAnswer,
  onGenerateFollowup,
  canGenerate
}: {
  turns: FollowupTurn[];
  pendingAnswer: string;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onGenerateFollowup: () => void;
  canGenerate: boolean;
}) {
  if (!canGenerate && turns.length === 0) return null;

  const latest = turns.at(-1);
  const needsAnswer = latest && !latest.answer;

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-ink">AI 面试官追问</h3>
        <button
          className="rounded border border-line px-3 py-2 text-sm disabled:opacity-50"
          type="button"
          disabled={!canGenerate || Boolean(needsAnswer)}
          onClick={onGenerateFollowup}
        >
          生成追问
        </button>
      </div>
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
      {needsAnswer ? (
        <div className="mt-4 grid gap-3">
          <textarea
            className="min-h-28 rounded border border-line p-3"
            value={pendingAnswer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="回答这一轮追问..."
          />
          <button className="w-fit rounded bg-ink px-4 py-2 text-white" type="button" onClick={onSubmitAnswer}>
            保存追问回答
          </button>
        </div>
      ) : null}
    </section>
  );
}
