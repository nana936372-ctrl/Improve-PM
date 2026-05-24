"use client";

import { useState } from "react";

import { ABILITY_DIMENSIONS, normalizeAbilityKey } from "@/lib/constants/abilities";
import { summarizeAbilitySnapshots } from "@/lib/training/analytics";
import type { DimensionScore } from "@/lib/types/training";

type SessionQuestionRow = {
  title?: string | null;
  prompt: string;
  scenario?: string | null;
  options?: unknown;
  rubric?: unknown;
  reference_answer?: unknown;
};

type UserResponseRow = {
  selected_options?: string[] | null;
  text_answer?: string | null;
  submitted_at?: string | null;
};

type EvaluationRow = {
  overall_score: number;
  dimension_scores?: unknown;
  strengths?: unknown;
  gaps?: unknown;
  advice?: string | null;
  option_analysis?: unknown;
};

type FollowupRow = {
  turn_index: number;
  question: string;
  intent?: string | null;
  user_answer?: string | null;
};

type SessionRow = {
  id: string;
  title: string;
  question_type: string;
  ability_keys?: string[] | null;
  difficulty?: string | null;
  overall_score: number | null;
  completed_at: string | null;
  session_questions?: SessionQuestionRow[] | null;
  user_responses?: UserResponseRow[] | null;
  evaluations?: EvaluationRow[] | null;
  followup_turns?: FollowupRow[] | null;
};

type SnapshotRow = {
  ability_key: string;
  score: number;
  max_score: number;
  created_at: string;
};

const abilityLabels = new Map<string, string>(ABILITY_DIMENSIONS.map((item) => [item.key, item.label]));
const trendLabels = {
  up: "上升",
  down: "下降",
  flat: "持平",
  new: "新数据"
};
const questionTypeLabels: Record<string, string> = {
  single_choice: "单选快练",
  multiple_choice: "多选快练",
  case_analysis: "案例深训"
};

function abilityLabel(key: string) {
  const normalizedKey = normalizeAbilityKey(key) ?? key;
  return abilityLabels.get(normalizedKey) ?? key;
}

function questionTypeLabel(type: string) {
  return questionTypeLabels[type] ?? type;
}

function primaryAbilityKey(session: SessionRow) {
  const key = session.ability_keys?.[0];
  return key ? normalizeAbilityKey(key) ?? key : "unknown";
}

function categoryKey(session: SessionRow) {
  return `${primaryAbilityKey(session)}::${session.question_type}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function buildTrainingCategories(sessions: SessionRow[]) {
  const groups = new Map<string, { key: string; abilityKey: string; questionType: string; sessions: SessionRow[] }>();

  for (const session of sessions) {
    const key = categoryKey(session);
    const existing = groups.get(key);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.set(key, {
        key,
        abilityKey: primaryAbilityKey(session),
        questionType: session.question_type,
        sessions: [session]
      });
    }
  }

  return [...groups.values()].map((category) => {
    const scores = category.sessions.map((session) => session.overall_score).filter((score): score is number => typeof score === "number");
    const latest = [...category.sessions].sort((a, b) => Date.parse(b.completed_at ?? "") - Date.parse(a.completed_at ?? ""))[0] ?? category.sessions[0];

    return {
      ...category,
      title: `${abilityLabel(category.abilityKey)} · ${questionTypeLabel(category.questionType)}`,
      count: category.sessions.length,
      averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      latestDate: latest?.completed_at ?? null
    };
  });
}

function firstItem<T>(items?: T[] | null) {
  return items?.[0] ?? null;
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("；");
  if (isRecord(value)) return Object.values(value).map(textValue).filter(Boolean).join("；");
  return "";
}

function numericValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function uniqueTexts(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function normalizeDimensionScore(score: DimensionScore): DimensionScore {
  const labelKey = score.label ? normalizeAbilityKey(score.label) : null;
  const key = normalizeAbilityKey(score.key) ?? labelKey ?? score.key;

  return {
    ...score,
    key,
    label: score.label && !labelKey ? score.label : undefined
  };
}

function mergeDimensionScores(scores: DimensionScore[]) {
  const grouped = new Map<string, DimensionScore[]>();

  for (const score of scores.map(normalizeDimensionScore)) {
    const current = grouped.get(score.key) ?? [];
    current.push(score);
    grouped.set(score.key, current);
  }

  return [...grouped.entries()].map(([key, rows]) => {
    const labels = uniqueTexts(rows.map((row) => row.label ?? ""));
    const evidence = uniqueTexts(rows.map((row) => row.evidence)).join("；") || "暂无该维度的详细依据。";
    const advice = uniqueTexts(rows.map((row) => row.advice)).join("；") || "建议补充该维度的分析。";

    return {
      key,
      label: labels.length === 1 ? labels[0] : undefined,
      score: Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length),
      maxScore: Math.round(rows.reduce((sum, row) => sum + row.maxScore, 0) / rows.length),
      evidence,
      advice
    };
  });
}

function dimensionScores(value: unknown) {
  if (!Array.isArray(value)) return [];

  const scores = value.flatMap((item) => {
    if (!isRecord(item) || typeof item.key !== "string") return [];

    return [
      {
        key: item.key,
        label: typeof item.label === "string" ? item.label : undefined,
        score: numericValue(item.score, 0),
        maxScore: numericValue(item.maxScore ?? item.max_score, 20),
        evidence: textValue(item.evidence) || "暂无该维度的详细依据。",
        advice: textValue(item.advice) || "建议补充该维度的分析。"
      }
    ];
  });

  return mergeDimensionScores(scores);
}

function normalizeSnapshots(snapshots: SnapshotRow[]): SnapshotRow[] {
  return snapshots.map((snapshot) => ({
    ...snapshot,
    ability_key: normalizeAbilityKey(snapshot.ability_key) ?? snapshot.ability_key
  }));
}

function buildAbilitySnapshotCards(snapshots: SnapshotRow[]) {
  const summaries = summarizeAbilitySnapshots(normalizeSnapshots(snapshots));
  const summaryByAbility = new Map(summaries.map((summary) => [summary.abilityKey, summary]));

  return ABILITY_DIMENSIONS.map((dimension) => ({
    key: dimension.key,
    label: dimension.label,
    summary: summaryByAbility.get(dimension.key) ?? null
  }));
}

function criterionText(value: unknown) {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return textValue(value);

  const title = textValue(value.title ?? value.name ?? value.dimension ?? value.key);
  const description = textValue(value.description ?? value.text ?? value.criterion ?? value.criteria ?? value.expectation);
  const score = textValue(value.score ?? value.maxScore ?? value.max_score);

  if (title && description) return score ? `${title}：${description}（${score}分）` : `${title}：${description}`;
  if (description) return score ? `${description}（${score}分）` : description;
  if (title) return score ? `${title}（${score}分）` : title;
  return textValue(value);
}

function parseJsonString(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function rubricText(value: unknown) {
  if (!value) return "";

  const parsedValue = typeof value === "string" ? parseJsonString(value) : value;
  if (typeof parsedValue === "string") return parsedValue;

  if (isRecord(parsedValue) && typeof parsedValue.text === "string") {
    return parsedValue.text;
  }

  if (!isRecord(parsedValue)) return textValue(parsedValue);

  const criteriaValue = parsedValue.criteria ?? parsedValue.grading_criteria ?? parsedValue.gradingCriteria;
  const criteria = Array.isArray(criteriaValue) ? criteriaValue.map(criterionText).filter(Boolean) : [];
  const lines: string[] = [];

  if (criteria.length) {
    lines.push("评分标准");
    lines.push(...criteria.map((item, index) => `${index + 1}. ${item}`));
  }

  const maxScore = textValue(parsedValue.maxScore ?? parsedValue.max_score);
  const passingScore = textValue(parsedValue.passingScore ?? parsedValue.passing_score);
  if (maxScore) lines.push(`满分：${maxScore}`);
  if (passingScore) lines.push(`通过分：${passingScore}`);

  return lines.length ? lines.join("\n") : textValue(parsedValue);
}

function optionText(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const option = item as { id?: unknown; text?: unknown };
      return typeof option.id === "string" && typeof option.text === "string" ? `${option.id}. ${option.text}` : "";
    })
    .filter(Boolean);
}

function responseText(response: UserResponseRow | null) {
  if (!response) return "暂无作答记录。";
  if (response.text_answer) return response.text_answer;
  if (response.selected_options?.length) return `选择：${response.selected_options.join(", ")}`;
  return "暂无作答记录。";
}

function scoreLabel(score: DimensionScore) {
  const labelKey = score.label ? normalizeAbilityKey(score.label) : null;
  if (labelKey) return abilityLabel(labelKey);
  return score.label ?? abilityLabel(score.key);
}

function HistoryDetail({ session }: { session: SessionRow | null }) {
  if (!session) {
    return (
      <section className="rounded-lg border border-dashed border-line bg-white p-5 text-sm text-muted lg:col-span-2">
        点击一条最近训练记录，查看题目、过往回答、评分和面试官追问。
      </section>
    );
  }

  const question = firstItem(session.session_questions);
  const response = firstItem(session.user_responses);
  const evaluation = firstItem(session.evaluations);
  const followups = [...(session.followup_turns ?? [])].sort((a, b) => a.turn_index - b.turn_index);
  const options = optionText(question?.options);
  const scores = dimensionScores(evaluation?.dimension_scores);
  const strengths = textList(evaluation?.strengths);
  const gaps = textList(evaluation?.gaps);
  const rubric = rubricText(question?.rubric);

  return (
    <section className="rounded-lg border border-line bg-white p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted">{session.question_type}</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">{session.title}</h2>
          <p className="mt-1 text-sm text-muted">难度：{session.difficulty ?? "-"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted">总分</p>
          <p className="text-3xl font-semibold text-ink">{session.overall_score ?? "-"}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-line p-4">
          <h3 className="font-medium text-ink">题目</h3>
          {question?.scenario ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">{question.scenario}</p> : null}
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{question?.prompt ?? "暂无题目详情。"}</p>
          {options.length ? (
            <ul className="mt-3 grid gap-2 text-sm text-muted">
              {options.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          ) : null}
          {rubric ? <p className="mt-3 whitespace-pre-wrap rounded bg-panel p-3 text-sm text-muted">{rubric}</p> : null}
        </div>

        <div className="rounded border border-line p-4">
          <h3 className="font-medium text-ink">过往回答</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{responseText(response)}</p>
          {evaluation?.advice ? (
            <div className="mt-4 rounded bg-blue-50 p-3 text-sm text-brand">
              <p className="font-medium">复盘建议</p>
              <p className="mt-1 leading-6">{evaluation.advice}</p>
            </div>
          ) : null}
        </div>
      </div>

      {evaluation ? (
        <div className="mt-4 rounded border border-line p-4">
          <h3 className="font-medium text-ink">评分反馈</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {scores.map((score) => (
              <div key={`${score.key}-${score.score}`} className="rounded border border-line p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span>{scoreLabel(score)}</span>
                  <span>
                    {score.score}/{score.maxScore}
                  </span>
                </div>
                <p className="mt-2 text-muted">{score.evidence}</p>
                <p className="mt-1 text-brand">{score.advice}</p>
              </div>
            ))}
          </div>
          {strengths.length || gaps.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">优势</p>
                <p className="mt-1 text-sm text-muted">{strengths.join("；") || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">差距</p>
                <p className="mt-1 text-sm text-muted">{gaps.join("；") || "-"}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 rounded border border-line p-4">
        <h3 className="font-medium text-ink">面试官追问</h3>
        {followups.length ? (
          <div className="mt-3 grid gap-3">
            {followups.map((turn) => (
              <div key={turn.turn_index} className="rounded bg-panel p-3 text-sm">
                <p className="font-medium text-ink">{turn.question}</p>
                {turn.intent ? <p className="mt-1 text-muted">意图：{turn.intent}</p> : null}
                <p className="mt-2 whitespace-pre-wrap text-ink">{turn.user_answer || "暂未回答。"}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">这次训练还没有保存追问。</p>
        )}
      </div>
    </section>
  );
}

export function GrowthDashboard({ sessions, snapshots }: { sessions: SessionRow[]; snapshots: SnapshotRow[] }) {
  const categories = buildTrainingCategories(sessions);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <div className="rounded-lg border border-line bg-white p-6 text-muted">还没有训练记录。完成一次训练后，这里会显示趋势。</div>;
  }

  const average = Math.round(sessions.reduce((sum, item) => sum + (item.overall_score ?? 0), 0) / sessions.length);
  const selectedCategory = categories.find((category) => category.key === selectedCategoryKey) ?? null;
  const categorySessions = selectedCategory?.sessions ?? [];
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;
  const abilityCards = buildAbilitySnapshotCards(snapshots);

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="rounded-lg border border-line bg-white p-5">
        <p className="text-sm text-muted">平均分</p>
        <div className="mt-2 text-4xl font-semibold text-ink">{average}</div>
        <p className="mt-2 text-sm text-muted">共 {sessions.length} 次训练</p>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold text-ink">训练分类</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category.key}
              className={`flex w-full items-center justify-between rounded border p-3 text-left transition ${
                selectedCategory?.key === category.key ? "border-brand bg-blue-50" : "border-line bg-white hover:bg-panel"
              }`}
              type="button"
              onClick={() => {
                setSelectedCategoryKey(category.key);
                setSelectedSessionId(null);
              }}
            >
              <span>
                <span className="block font-medium text-ink">{category.title}</span>
                <span className="block text-sm text-muted">
                  {category.count} 次 · 平均 {category.averageScore ?? "-"} · 最近 {formatDate(category.latestDate)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold text-ink">该分类下的题目</h2>
        {selectedCategory ? (
          <div className="mt-4 grid gap-3">
            {categorySessions.map((session) => (
              <button
                key={session.id}
                className={`flex w-full items-center justify-between rounded border p-3 text-left transition ${
                  selectedSessionId === session.id ? "border-brand bg-blue-50" : "border-line bg-white hover:bg-panel"
                }`}
                type="button"
                onClick={() => setSelectedSessionId(session.id)}
              >
                <span>
                  <span className="block font-medium text-ink">{session.title}</span>
                  <span className="block text-sm text-muted">
                    {questionTypeLabel(session.question_type)} · {session.difficulty ?? "-"} · {formatDate(session.completed_at)}
                  </span>
                </span>
                <span className="text-lg font-semibold text-ink">{session.overall_score ?? "-"}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded border border-dashed border-line p-4 text-sm text-muted">选择一个训练分类后查看该类目下的题目。</p>
        )}
      </section>

      <HistoryDetail session={selectedSession} />

      <section className="rounded-lg border border-line bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold text-ink">能力快照</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {abilityCards.map((card) => (
            <div key={card.key} className="rounded border border-line p-3">
              {card.summary ? (
                <>
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{card.label}</p>
                      <p className="mt-1 text-muted">平均 {card.summary.averageScore}/20</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-ink">
                        最新 {card.summary.latestScore}/{card.summary.latestMaxScore}
                      </p>
                      <p className="mt-1 text-muted">{trendLabels[card.summary.trend]}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <div className="h-2 rounded bg-panel" aria-label={`${card.label} 最新得分`}>
                      <div className="h-2 rounded bg-brand" style={{ width: `${card.summary.latestPercent}%` }} />
                    </div>
                    <div className="h-1.5 rounded bg-panel" aria-label={`${card.label} 平均得分`}>
                      <div className="h-1.5 rounded bg-success" style={{ width: `${card.summary.averagePercent}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{card.label}</p>
                    <p className="mt-1 text-muted">暂无数据</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-ink">最新 -</p>
                    <p className="mt-1 text-muted">未训练</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="h-2 rounded bg-panel" aria-label={`${card.label} 最新得分`}>
                    <div className="h-2 rounded bg-brand" style={{ width: "0%" }} />
                  </div>
                  <div className="h-1.5 rounded bg-panel" aria-label={`${card.label} 平均得分`}>
                    <div className="h-1.5 rounded bg-success" style={{ width: "0%" }} />
                  </div>
                </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
