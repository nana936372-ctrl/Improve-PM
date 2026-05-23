"use client";

import { useState } from "react";

import { ABILITY_DIMENSIONS } from "@/lib/constants/abilities";
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

function abilityLabel(key: string) {
  return abilityLabels.get(key) ?? key;
}

function firstItem<T>(items?: T[] | null) {
  return items?.[0] ?? null;
}

function textList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function dimensionScores(value: unknown) {
  return Array.isArray(value) ? (value.filter(Boolean) as DimensionScore[]) : [];
}

function rubricText(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "text" in value && typeof (value as { text?: unknown }).text === "string") {
    return (value as { text: string }).text;
  }
  return JSON.stringify(value, null, 2);
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
                  <span>{score.key}</span>
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
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <div className="rounded-lg border border-line bg-white p-6 text-muted">还没有训练记录。完成一次训练后，这里会显示趋势。</div>;
  }

  const average = Math.round(sessions.reduce((sum, item) => sum + (item.overall_score ?? 0), 0) / sessions.length);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;
  const abilitySummaries = summarizeAbilitySnapshots(snapshots);

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
                <span className="block text-sm text-muted">{session.question_type}</span>
              </span>
              <span className="text-lg font-semibold text-ink">{session.overall_score ?? "-"}</span>
            </button>
          ))}
        </div>
      </section>

      <HistoryDetail session={selectedSession} />

      <section className="rounded-lg border border-line bg-white p-5 lg:col-span-2">
        <h2 className="font-semibold text-ink">能力快照</h2>
        {abilitySummaries.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {abilitySummaries.map((summary) => (
              <div key={summary.abilityKey} className="rounded border border-line p-3">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{abilityLabel(summary.abilityKey)}</p>
                    <p className="mt-1 text-muted">平均 {summary.averageScore}/20</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-ink">最新 {summary.latestScore}/{summary.latestMaxScore}</p>
                    <p className="mt-1 text-muted">{trendLabels[summary.trend]}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="h-2 rounded bg-panel" aria-label={`${abilityLabel(summary.abilityKey)} 最新得分`}>
                    <div className="h-2 rounded bg-brand" style={{ width: `${summary.latestPercent}%` }} />
                  </div>
                  <div className="h-1.5 rounded bg-panel" aria-label={`${abilityLabel(summary.abilityKey)} 平均得分`}>
                    <div className="h-1.5 rounded bg-success" style={{ width: `${summary.averagePercent}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded border border-dashed border-line p-4 text-sm text-muted">还没有能力快照。</p>
        )}
      </section>
    </div>
  );
}
