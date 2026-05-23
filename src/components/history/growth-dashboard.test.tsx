import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GrowthDashboard } from "./growth-dashboard";

describe("GrowthDashboard", () => {
  it("renders empty state", () => {
    render(<GrowthDashboard sessions={[]} snapshots={[]} />);
    expect(screen.getByText("还没有训练记录。完成一次训练后，这里会显示趋势。")).toBeInTheDocument();
  });

  it("renders average score", () => {
    render(
      <GrowthDashboard
        sessions={[{ id: "1", title: "案例题", question_type: "case_analysis", overall_score: 80, completed_at: null }]}
        snapshots={[]}
      />
    );
    expect(screen.getAllByText("80").length).toBeGreaterThan(0);
  });

  it("renders an aggregated ability snapshot graphic", () => {
    render(
      <GrowthDashboard
        sessions={[{ id: "1", title: "案例题", question_type: "case_analysis", overall_score: 80, completed_at: null }]}
        snapshots={[
          { ability_key: "ai_boundary", score: 12, max_score: 20, created_at: "2026-05-22T10:00:00Z" },
          { ability_key: "ai_boundary", score: 16, max_score: 20, created_at: "2026-05-23T10:00:00Z" }
        ]}
      />
    );

    expect(screen.getByText("AI 能力边界判断")).toBeInTheDocument();
    expect(screen.getByText("平均 14/20")).toBeInTheDocument();
    expect(screen.getByText("最新 16/20")).toBeInTheDocument();
    expect(screen.getByText("上升")).toBeInTheDocument();
  });

  it("shows historical answer and follow-ups after clicking a training record", () => {
    render(
      <GrowthDashboard
        sessions={[
          {
            id: "1",
            title: "AI 客服的时效性问题",
            question_type: "case_analysis",
            difficulty: "beginner",
            overall_score: 80,
            completed_at: null,
            session_questions: [
              {
                title: "AI 客服的时效性问题",
                prompt: "请分析 AI 客服实时信息错误的产品边界。",
                scenario: "业务方希望系统回答物流和天气查询。",
                rubric: { text: "识别边界并提出分层方案。" }
              }
            ],
            user_responses: [
              {
                selected_options: null,
                text_answer: "需要 API 调用、置信度阈值和人工兜底。"
              }
            ],
            evaluations: [
              {
                overall_score: 80,
                dimension_scores: [{ key: "ai_boundary", score: 16, maxScore: 20, evidence: "提到了人工兜底。", advice: "补充验证指标。" }],
                strengths: ["能识别边界"],
                gaps: ["指标不足"],
                advice: "补充工具调用成功率。"
              }
            ],
            followup_turns: [
              {
                turn_index: 1,
                question: "如何验证方案有效？",
                intent: "考察指标设计",
                user_answer: "灰度实验观察一次解决率。"
              }
            ]
          }
        ]}
        snapshots={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /AI 客服的时效性问题/ }));

    expect(screen.getByText("过往回答")).toBeInTheDocument();
    expect(screen.getByText("需要 API 调用、置信度阈值和人工兜底。")).toBeInTheDocument();
    expect(screen.getByText("面试官追问")).toBeInTheDocument();
    expect(screen.getByText("如何验证方案有效？")).toBeInTheDocument();
    expect(screen.getByText("灰度实验观察一次解决率。")).toBeInTheDocument();
  });
});
