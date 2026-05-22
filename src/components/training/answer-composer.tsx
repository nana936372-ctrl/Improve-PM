"use client";

import type { TrainingQuestion } from "@/lib/types/training";

export function AnswerComposer({
  question,
  answer,
  selectedOptions,
  onTextChange,
  onToggleOption
}: {
  question: TrainingQuestion | null;
  answer: string;
  selectedOptions: string[];
  onTextChange: (value: string) => void;
  onToggleOption: (value: string) => void;
}) {
  if (!question) return null;

  if (question.type === "case_analysis") {
    return (
      <textarea
        className="min-h-72 w-full resize-y rounded-lg border border-line bg-white p-4 leading-7 outline-none focus:border-brand"
        placeholder="写下你的产品分析、方案取舍、指标设计和风险治理思考..."
        value={answer}
        onChange={(event) => onTextChange(event.target.value)}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {question.options?.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onToggleOption(option.id)}
          className={`rounded-lg border p-4 text-left ${selectedOptions.includes(option.id) ? "border-brand bg-blue-50" : "border-line bg-white"}`}
        >
          <span className="font-semibold">{option.id}.</span> {option.text}
        </button>
      ))}
    </div>
  );
}
