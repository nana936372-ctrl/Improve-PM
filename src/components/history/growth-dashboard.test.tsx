import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("shows all official ability dimensions even when some have no snapshots", () => {
    render(
      <GrowthDashboard
        sessions={[{ id: "1", title: "案例题", question_type: "case_analysis", overall_score: 80, completed_at: null }]}
        snapshots={[
          { ability_key: "ai_boundary", score: 16, max_score: 20, created_at: "2026-05-23T10:00:00Z" },
          { ability_key: "risk_governance", score: 12, max_score: 20, created_at: "2026-05-23T10:00:00Z" }
        ]}
      />
    );

    expect(screen.getByText("用户与业务洞察")).toBeInTheDocument();
    expect(screen.getByText("问题定义与目标拆解")).toBeInTheDocument();
    expect(screen.getByText("AI 能力边界判断")).toBeInTheDocument();
    expect(screen.getByText("方案设计与取舍")).toBeInTheDocument();
    expect(screen.getByText("指标与实验设计")).toBeInTheDocument();
    expect(screen.getByText("风险、伦理与治理")).toBeInTheDocument();
    expect(screen.getAllByText("暂无数据")).toHaveLength(4);
    expect(screen.getAllByText("未训练")).toHaveLength(4);
  });

  it("normalizes old ability snapshot aliases before rendering summaries", () => {
    render(
      <GrowthDashboard
        sessions={[{ id: "1", title: "案例题", question_type: "case_analysis", overall_score: 80, completed_at: null }]}
        snapshots={[
          { ability_key: "understanding_ai_boundary", score: 20, max_score: 20, created_at: "2026-05-22T10:00:00Z" },
          { ability_key: "ai_boundary_understanding", score: 16, max_score: 20, created_at: "2026-05-23T10:00:00Z" },
          { ability_key: "risk_awareness", score: 14, max_score: 20, created_at: "2026-05-23T10:00:00Z" }
        ]}
      />
    );

    expect(screen.getByText("AI 能力边界判断")).toBeInTheDocument();
    expect(screen.getByText("平均 18/20")).toBeInTheDocument();
    expect(screen.getByText("风险、伦理与治理")).toBeInTheDocument();
    expect(screen.queryByText("understanding_ai_boundary")).not.toBeInTheDocument();
    expect(screen.queryByText("ai_boundary_understanding")).not.toBeInTheDocument();
    expect(screen.queryByText("risk_awareness")).not.toBeInTheDocument();
  });

  it("shows historical answer and follow-ups after clicking a training record", () => {
    render(
      <GrowthDashboard
        sessions={[
          {
            id: "1",
            title: "AI 客服的时效性问题",
            question_type: "case_analysis",
            ability_keys: ["ai_boundary"],
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

    fireEvent.click(screen.getByRole("button", { name: /AI 能力边界判断 · 案例深训/ }));
    fireEvent.click(screen.getByRole("button", { name: /AI 客服的时效性问题/ }));

    expect(screen.getByText("过往回答")).toBeInTheDocument();
    expect(screen.getByText("需要 API 调用、置信度阈值和人工兜底。")).toBeInTheDocument();
    expect(screen.getByText("面试官追问")).toBeInTheDocument();
    expect(screen.getByText("如何验证方案有效？")).toBeInTheDocument();
    expect(screen.getByText("灰度实验观察一次解决率。")).toBeInTheDocument();
  });

  it("formats historical rubric objects without exposing raw JSON", () => {
    render(
      <GrowthDashboard
        sessions={[
          {
            id: "1",
            title: "智能客服边界判断",
            question_type: "case_analysis",
            ability_keys: ["ai_boundary"],
            difficulty: "intermediate",
            overall_score: 70,
            completed_at: null,
            session_questions: [
              {
                prompt: "请判断哪些客服场景适合 LLM 直接处理。",
                rubric: {
                  criteria: ["识别AI能力边界：说明实时数据限制。", "提出分层方案：区分静态知识与动态查询。"],
                  maxScore: 10,
                  passingScore: 6
                }
              }
            ]
          }
        ]}
        snapshots={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /AI 能力边界判断 · 案例深训/ }));
    fireEvent.click(screen.getByRole("button", { name: /智能客服边界判断/ }));

    expect(screen.getByText(/评分标准/)).toBeInTheDocument();
    expect(screen.getByText(/1\. 识别AI能力边界：说明实时数据限制。/)).toBeInTheDocument();
    expect(screen.getByText(/2\. 提出分层方案：区分静态知识与动态查询。/)).toBeInTheDocument();
    expect(screen.getByText(/满分：10/)).toBeInTheDocument();
    expect(screen.getByText(/通过分：6/)).toBeInTheDocument();
    expect(screen.queryByText(/"criteria"/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"maxScore"/)).not.toBeInTheDocument();
  });

  it("normalizes historical evaluation dimension labels in detail feedback", () => {
    render(
      <GrowthDashboard
        sessions={[
          {
            id: "1",
            title: "退换货客服方案",
            question_type: "case_analysis",
            ability_keys: ["ai_boundary"],
            difficulty: "intermediate",
            overall_score: 20,
            completed_at: null,
            session_questions: [{ prompt: "请分析退换货客服场景的 AI 能力边界。" }],
            evaluations: [
              {
                overall_score: 20,
                dimension_scores: [
                  { key: "识别AI能力边界", score: 0, maxScore: 20, evidence: "AI 未提供该维度的具体依据。", advice: "建议补充该维度的分析。" },
                  { key: "分析业务影响", score: 0, maxScore: 20, evidence: "AI 未提供该维度的具体依据。", advice: "建议补充该维度的分析。" },
                  { key: "提出分层方案", score: 2, maxScore: 20, evidence: "提出了部分分层。", advice: "补充落地路径。" },
                  { key: "沟通策略", score: 0, maxScore: 20, evidence: "AI 未提供该维度的具体依据。", advice: "建议补充该维度的分析。" }
                ],
                strengths: [],
                gaps: [],
                advice: "继续训练。"
              }
            ]
          }
        ]}
        snapshots={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /AI 能力边界判断 · 案例深训/ }));
    fireEvent.click(screen.getByRole("button", { name: /退换货客服方案/ }));

    const feedback = screen.getByText("评分反馈").closest("div");
    expect(feedback).not.toBeNull();
    const feedbackScope = within(feedback!);

    expect(feedbackScope.getByText("AI 能力边界判断")).toBeInTheDocument();
    expect(feedbackScope.getByText("用户与业务洞察")).toBeInTheDocument();
    expect(feedbackScope.getByText("方案设计与取舍")).toBeInTheDocument();
    expect(feedbackScope.queryByText("识别AI能力边界")).not.toBeInTheDocument();
    expect(feedbackScope.queryByText("分析业务影响")).not.toBeInTheDocument();
    expect(feedbackScope.queryByText("提出分层方案")).not.toBeInTheDocument();
    expect(feedbackScope.queryByText("沟通策略")).not.toBeInTheDocument();
  });

  it("groups recent training by ability and question type before showing questions", () => {
    render(
      <GrowthDashboard
        sessions={[
          {
            id: "1",
            title: "AI 客服边界判断",
            question_type: "single_choice",
            ability_keys: ["ai_boundary"],
            difficulty: "beginner",
            overall_score: 100,
            completed_at: "2026-05-24T10:00:00Z",
            session_questions: [{ prompt: "AI 客服能否完全替代人工？" }]
          },
          {
            id: "2",
            title: "用户画像生成",
            question_type: "single_choice",
            ability_keys: ["ai_boundary"],
            difficulty: "intermediate",
            overall_score: 80,
            completed_at: "2026-05-24T11:00:00Z",
            session_questions: [{ prompt: "用户画像生成的 AI 边界是什么？" }]
          },
          {
            id: "3",
            title: "实验指标选择",
            question_type: "multiple_choice",
            ability_keys: ["metrics_experiment"],
            difficulty: "intermediate",
            overall_score: 60,
            completed_at: "2026-05-23T11:00:00Z",
            session_questions: [{ prompt: "哪些指标适合评估 AI 问答？" }]
          }
        ]}
        snapshots={[]}
      />
    );

    expect(screen.getByText("训练分类")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI 能力边界判断 · 单选快练/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2 次/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /AI 客服边界判断/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /AI 能力边界判断 · 单选快练/ }));

    expect(screen.getByText("该分类下的题目")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI 客服边界判断/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /用户画像生成/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /实验指标选择/ })).not.toBeInTheDocument();
  });
});
