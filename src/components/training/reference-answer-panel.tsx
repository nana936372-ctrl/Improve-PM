export type ReferenceAnswer = {
  outline: string[];
  sampleAnswer: string;
  commonMistakes: string[];
  nextTrainingAdvice: string;
};

export function ReferenceAnswerPanel({ referenceAnswer }: { referenceAnswer: ReferenceAnswer | null }) {
  if (!referenceAnswer) return null;

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h3 className="font-semibold text-ink">参考答案与复盘</h3>
      <div className="mt-4 grid gap-4">
        <div>
          <p className="text-sm font-medium">优秀答案框架</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {referenceAnswer.outline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{referenceAnswer.sampleAnswer}</p>
        <div>
          <p className="text-sm font-medium">常见误区</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {referenceAnswer.commonMistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="rounded bg-blue-50 p-3 text-sm text-brand">{referenceAnswer.nextTrainingAdvice}</p>
      </div>
    </section>
  );
}
