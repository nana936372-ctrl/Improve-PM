"use client";

import { useEffect, useState } from "react";

import { ABILITY_DIMENSIONS, type AbilityKey } from "@/lib/constants/abilities";
import { AI_CONFIG_STORAGE_KEY, isCompleteAiConfig, type StoredAiConfig } from "@/lib/settings/ai-config";
import type { Difficulty, EvaluationResult, QuestionType, TrainingQuestion } from "@/lib/types/training";

import { AnswerComposer } from "./answer-composer";
import { EvaluationPanel } from "./evaluation-panel";
import { FollowupPanel, type FollowupTurn } from "./followup-panel";
import { QuestionCard } from "./question-card";
import { ReferenceAnswerPanel, type ReferenceAnswer } from "./reference-answer-panel";

export function TrainingWorkbench() {
  const [questionType, setQuestionType] = useState<QuestionType>("case_analysis");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [abilityKey, setAbilityKey] = useState<AbilityKey>("ai_boundary");
  const [question, setQuestion] = useState<TrainingQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [followups, setFollowups] = useState<FollowupTurn[]>([]);
  const [pendingFollowupAnswer, setPendingFollowupAnswer] = useState("");
  const [referenceAnswer, setReferenceAnswer] = useState<ReferenceAnswer | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function messageFromError(err: unknown) {
    return err instanceof Error ? err.message : "请求失败，请检查 AI 配置后重试。";
  }

  function getAiConfig() {
    const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
    if (!raw) return undefined;
    const config = JSON.parse(raw) as Partial<StoredAiConfig>;
    return isCompleteAiConfig(config) ? config : undefined;
  }

  useEffect(() => {
    const saved = localStorage.getItem("training-draft");
    if (saved) setAnswer(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("training-draft", answer);
  }, [answer]);

  async function saveFollowups(nextFollowups: FollowupTurn[]) {
    if (!sessionId) return;
    const response = await fetch(`/api/sessions/${sessionId}/followups`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followups: nextFollowups })
    });
    if (!response.ok) throw new Error("追问保存失败。");
  }

  async function generateQuestion() {
    try {
      setError("");
      setStatus("正在生成题目...");
      setSessionId(null);
      const response = await fetch("/api/ai/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionType, difficulty, abilityKeys: [abilityKey], aiConfig: getAiConfig() })
      });
      if (!response.ok) throw new Error("题目生成失败，请检查 AI 配置后重试。");
      const data = await response.json();
      setQuestion(data.question);
      const sessionResponse = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: data.question })
      });
      if (!sessionResponse.ok) throw new Error("训练记录保存失败。");
      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.sessionId);
      setEvaluation(null);
      setFollowups([]);
      setPendingFollowupAnswer("");
      setReferenceAnswer(null);
      setAnswer("");
      setSelectedOptions([]);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setStatus("");
    }
  }

  async function submitAnswer() {
    if (!question) return;
    try {
      setError("");
      setStatus("正在评分...");
      const response = await fetch("/api/ai/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions },
          aiConfig: getAiConfig()
        })
      });
      if (!response.ok) throw new Error("答案评分失败，请检查 AI 配置后重试。");
      const data = await response.json();
      setEvaluation(data.evaluation);
      if (sessionId) {
        const sessionResponse = await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions },
            evaluation: data.evaluation,
            followups
          })
        });
        if (!sessionResponse.ok) throw new Error("训练结果保存失败。");
      }
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setStatus("");
    }
  }

  async function generateFollowup() {
    if (!question || !evaluation || followups.length >= 3) return;
    try {
      setError("");
      setStatus("正在生成追问...");
      const response = await fetch("/api/ai/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, evaluation, previousAnswers: followups, aiConfig: getAiConfig() })
      });
      if (!response.ok) throw new Error("追问生成失败，请检查 AI 配置后重试。");
      const data = await response.json();
      const nextFollowups = [...followups, { question: data.followup.question, intent: data.followup.intent }];
      setFollowups(nextFollowups);
      await saveFollowups(nextFollowups);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setStatus("");
    }
  }

  async function submitFollowupAnswer() {
    try {
      setError("");
      const next = [...followups];
      const last = next[next.length - 1];
      if (last) next[next.length - 1] = { ...last, answer: pendingFollowupAnswer };
      setFollowups(next);
      setPendingFollowupAnswer("");
      await saveFollowups(next);
    } catch (err) {
      setError(messageFromError(err));
    }
  }

  async function generateReferenceAnswer() {
    if (!question || !evaluation) return;
    try {
      setError("");
      setStatus("正在生成参考答案...");
      const response = await fetch("/api/ai/reference-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions },
          evaluation,
          followups,
          aiConfig: getAiConfig()
        })
      });
      if (!response.ok) throw new Error("参考答案生成失败：AI 返回格式不符合要求或服务不可用，请稍后重试。");
      const data = await response.json();
      setReferenceAnswer(data.referenceAnswer);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setStatus("");
    }
  }

  function toggleOption(option: string) {
    if (!question) return;
    if (question.type === "single_choice") {
      setSelectedOptions([option]);
      return;
    }
    setSelectedOptions((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr_360px]">
      <aside className="rounded-lg border border-line bg-white p-4">
        <h1 className="text-lg font-semibold text-ink">训练配置</h1>
        <label className="mt-4 grid gap-2 text-sm">
          题型
          <select className="rounded border border-line px-3 py-2" value={questionType} onChange={(event) => setQuestionType(event.target.value as QuestionType)}>
            <option value="case_analysis">案例深训</option>
            <option value="single_choice">单选快练</option>
            <option value="multiple_choice">多选快练</option>
          </select>
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          能力维度
          <select className="rounded border border-line px-3 py-2" value={abilityKey} onChange={(event) => setAbilityKey(event.target.value as AbilityKey)}>
            {ABILITY_DIMENSIONS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 grid gap-2 text-sm">
          难度
          <select className="rounded border border-line px-3 py-2" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
            <option value="beginner">入门</option>
            <option value="intermediate">进阶</option>
            <option value="advanced">高阶</option>
          </select>
        </label>
        <button className="mt-5 w-full rounded bg-brand px-4 py-2 text-white" type="button" onClick={generateQuestion}>
          生成新题
        </button>
        {status ? <p className="mt-3 text-sm text-muted">{status}</p> : null}
        {error ? <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-danger">{error}</p> : null}
      </aside>

      <section className="grid gap-4">
        <QuestionCard question={question} />
        <AnswerComposer question={question} answer={answer} selectedOptions={selectedOptions} onTextChange={setAnswer} onToggleOption={toggleOption} />
        <button className="rounded bg-ink px-4 py-2 text-white disabled:opacity-50" type="button" disabled={!question || !sessionId || Boolean(status)} onClick={submitAnswer}>
          提交评分
        </button>
        <FollowupPanel
          turns={followups}
          pendingAnswer={pendingFollowupAnswer}
          onAnswerChange={setPendingFollowupAnswer}
          onSubmitAnswer={submitFollowupAnswer}
          onGenerateFollowup={generateFollowup}
          canGenerate={Boolean(question?.type === "case_analysis" && evaluation && followups.length < 3)}
        />
        {evaluation && question?.type !== "single_choice" ? (
          <button className="w-fit rounded border border-line bg-white px-4 py-2" type="button" onClick={generateReferenceAnswer}>
            生成参考答案
          </button>
        ) : null}
        <ReferenceAnswerPanel referenceAnswer={referenceAnswer} />
      </section>

      <EvaluationPanel evaluation={evaluation} />
    </div>
  );
}
