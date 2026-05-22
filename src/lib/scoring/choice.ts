export type ChoiceScoreInput = {
  selectedOptions: string[];
  correctOptions: string[];
  maxScore?: number;
};

export function scoreChoiceAnswer({ selectedOptions, correctOptions, maxScore = 100 }: ChoiceScoreInput) {
  const selected = new Set(selectedOptions);
  const correct = new Set(correctOptions);

  if (correct.size === 0) return 0;

  let right = 0;
  let wrong = 0;
  for (const option of selected) {
    if (correct.has(option)) right += 1;
    else wrong += 1;
  }

  const raw = (right - wrong) / correct.size;
  return Math.max(0, Math.round(raw * maxScore));
}
