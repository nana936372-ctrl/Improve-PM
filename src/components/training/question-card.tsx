import type { TrainingQuestion } from "@/lib/types/training";

export function QuestionCard({ question }: { question: TrainingQuestion | null }) {
  if (!question) {
    return <div className="rounded-lg border border-dashed border-line bg-white p-6 text-muted">选择训练配置后生成题目。</div>;
  }

  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <p className="text-xs uppercase text-muted">{question.type}</p>
      <h2 className="mt-2 text-xl font-semibold text-ink">{question.title}</h2>
      {question.scenario ? <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{question.scenario}</p> : null}
      <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-ink">{question.prompt}</p>
    </section>
  );
}
