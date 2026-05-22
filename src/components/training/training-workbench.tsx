"use client";

import { useEffect, useState } from "react";

import { ABILITY_DIMENSIONS, type AbilityKey } from "@/lib/constants/abilities";
import type { Difficulty, EvaluationResult, QuestionType, TrainingQuestion } from "@/lib/types/training";

import { AnswerComposer } from "./answer-composer";
import { EvaluationPanel } from "./evaluation-panel";
import { FollowupPanel, type FollowupTurn } from "./followup-panel";
import { QuestionCard } from "./question-card";

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
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("training-draft");
    if (saved) setAnswer(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("training-draft", answer);
  }, [answer]);

  async function generateQuestion() {
    setStatus("正在生成题目...");
    const response = await fetch("/api/ai/generate-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionType, difficulty, abilityKeys: [abilityKey] })
    });
    const data = await response.json();
    setQuestion(data.question);
    const sessionResponse = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: data.question })
    });
    const sessionData = await sessionResponse.json();
    setSessionId(sessionData.sessionId);
    setEvaluation(null);
    setFollowups([]);
    setAnswer("");
    setSelectedOptions([]);
    setStatus("");
  }

  async function submitAnswer() {
    if (!question) return;
    setStatus("正在评分...");
    const response = await fetch("/api/ai/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions }
      })
    });
    const data = await response.json();
    setEvaluation(data.evaluation);
    if (sessionId) {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: question.type === "case_analysis" ? { textAnswer: answer } : { selectedOptions },
          evaluation: data.evaluation
        })
      });
    }
    setStatus("");
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
      </aside>

      <section className="grid gap-4">
        <QuestionCard question={question} />
        <AnswerComposer question={question} answer={answer} selectedOptions={selectedOptions} onTextChange={setAnswer} onToggleOption={toggleOption} />
        <button className="rounded bg-ink px-4 py-2 text-white disabled:opacity-50" type="button" disabled={!question} onClick={submitAnswer}>
          提交评分
        </button>
        <FollowupPanel turns={followups} />
      </section>

      <EvaluationPanel evaluation={evaluation} />
    </div>
  );
}
