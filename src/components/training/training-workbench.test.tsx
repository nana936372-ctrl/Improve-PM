import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TrainingWorkbench } from "./training-workbench";

describe("TrainingWorkbench", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders training controls", () => {
    render(<TrainingWorkbench />);
    expect(screen.getByRole("heading", { name: "训练配置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成新题" })).toBeInTheDocument();
  });

  it("shows a visible error when question generation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("网络坏了");
      })
    );

    render(<TrainingWorkbench />);
    fireEvent.click(screen.getByRole("button", { name: "生成新题" }));

    await waitFor(() => expect(screen.getByText("网络坏了")).toBeInTheDocument());
  });

  it("keeps answer submission disabled until the session is saved", async () => {
    let resolveSession!: (value: unknown) => void;
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/ai/generate-question")) {
          return {
            ok: true,
            json: async () => ({
              question: {
                type: "case_analysis",
                title: "AI 客服质检",
                prompt: "请设计质检方案。",
                abilityKeys: ["ai_boundary"],
                difficulty: "intermediate"
              }
            })
          };
        }
        if (url.includes("/api/sessions")) {
          return sessionPromise;
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(<TrainingWorkbench />);
    fireEvent.click(screen.getByRole("button", { name: "生成新题" }));

    await waitFor(() => expect(screen.getByPlaceholderText(/写下你的产品分析/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "提交评分" })).toBeDisabled();

    resolveSession({
      ok: true,
      json: async () => ({ sessionId: "session-1" })
    });

    await waitFor(() => expect(screen.getByRole("button", { name: "提交评分" })).toBeEnabled());
  });

  it("persists follow-up turns after the user saves a follow-up answer", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/ai/generate-question")) {
        return {
          ok: true,
          json: async () => ({
            question: {
              type: "case_analysis",
              title: "AI 客服质检",
              prompt: "请设计质检方案。",
              abilityKeys: ["ai_boundary"],
              difficulty: "intermediate"
            }
          })
        };
      }
      if (url === "/api/sessions") {
        return {
          ok: true,
          json: async () => ({ sessionId: "session-1" })
        };
      }
      if (url.includes("/api/ai/evaluate")) {
        return {
          ok: true,
          json: async () => ({
            evaluation: {
              overallScore: 80,
              dimensionScores: [{ key: "ai_boundary", score: 16, maxScore: 20, evidence: "提到兜底。", advice: "补充指标。" }],
              strengths: ["边界清晰"],
              gaps: ["指标不足"],
              advice: "补充工具调用成功率。"
            }
          })
        };
      }
      if (url === "/api/sessions/session-1") {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      if (url.includes("/api/ai/followup")) {
        return {
          ok: true,
          json: async () => ({
            followup: {
              question: "如何验证方案有效？",
              intent: "考察指标设计"
            }
          })
        };
      }
      if (url === "/api/sessions/session-1/followups") {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      throw new Error(`Unexpected request: ${url} ${init?.method ?? ""}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<TrainingWorkbench />);
    fireEvent.click(screen.getByRole("button", { name: "生成新题" }));

    await waitFor(() => expect(screen.getByPlaceholderText(/写下你的产品分析/)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/写下你的产品分析/), { target: { value: "需要置信度阈值和人工兜底。" } });
    fireEvent.click(screen.getByRole("button", { name: "提交评分" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "生成追问" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "生成追问" }));

    await waitFor(() => expect(screen.getByText(/如何验证方案有效/)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("回答这一轮追问..."), { target: { value: "灰度实验观察一次解决率。" } });
    fireEvent.click(screen.getByRole("button", { name: "保存追问回答" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/sessions/session-1/followups",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("灰度实验观察一次解决率。")
        })
      )
    );
  });

  it("shows a specific error when reference answer generation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/ai/generate-question")) {
          return {
            ok: true,
            json: async () => ({
              question: {
                type: "case_analysis",
                title: "AI 客服质检",
                prompt: "请设计一个 AI 客服质检方案。",
                abilityKeys: ["ai_boundary"],
                difficulty: "intermediate"
              }
            })
          };
        }
        if (url === "/api/sessions") {
          return {
            ok: true,
            json: async () => ({ sessionId: "session-1" })
          };
        }
        if (url.includes("/api/ai/evaluate")) {
          return {
            ok: true,
            json: async () => ({
              evaluation: {
                overallScore: 80,
                dimensionScores: [{ key: "ai_boundary", score: 16, maxScore: 20, evidence: "选择了 B。", advice: "补充边界。" }],
                strengths: ["边界清晰"],
                gaps: ["指标不足"],
                advice: "补充指标。"
              }
            })
          };
        }
        if (url === "/api/sessions/session-1") {
          return { ok: true, json: async () => ({ ok: true }) };
        }
        if (url.includes("/api/ai/reference-answer")) {
          return { ok: false, json: async () => ({ error: "bad schema" }) };
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(<TrainingWorkbench />);
    fireEvent.click(screen.getByRole("button", { name: "生成新题" }));

    await waitFor(() => expect(screen.getByPlaceholderText(/写下你的产品分析/)).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/写下你的产品分析/), { target: { value: "需要抽检、人工兜底和风险分层。" } });
    fireEvent.click(screen.getByRole("button", { name: "提交评分" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "生成参考答案" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "生成参考答案" }));

    await waitFor(() => expect(screen.getByText("参考答案生成失败：AI 返回格式不符合要求或服务不可用，请稍后重试。")).toBeInTheDocument());
  });

  it("shows single-choice scoring as answer analysis and skips the reference-answer action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/ai/generate-question")) {
          return {
            ok: true,
            json: async () => ({
              question: {
                type: "single_choice",
                title: "AI 能力边界判断",
                prompt: "哪种做法最符合 AI 能力边界？",
                options: [
                  { id: "A", text: "直接使用 LLM 分析原始日志。" },
                  { id: "B", text: "先将日志转换为结构化特征，再输入 LLM 生成描述。" }
                ],
                correctOptions: ["B"],
                abilityKeys: ["ai_boundary"],
                difficulty: "intermediate"
              }
            })
          };
        }
        if (url === "/api/sessions") {
          return {
            ok: true,
            json: async () => ({ sessionId: "session-1" })
          };
        }
        if (url.includes("/api/ai/evaluate")) {
          return {
            ok: true,
            json: async () => ({
              evaluation: {
                overallScore: 100,
                dimensionScores: [
                  {
                    key: "ai_boundary",
                    label: "答案解析",
                    score: 100,
                    maxScore: 100,
                    evidence: "更优答案是 B。B. 先将日志转换为结构化特征，再输入 LLM 生成描述。",
                    advice: "PM 需要考虑数据结构化、人工审核和指标验证。"
                  }
                ],
                strengths: ["选项判断正确"],
                gaps: [],
                advice: "继续训练 AI 能力边界判断。"
              }
            })
          };
        }
        if (url === "/api/sessions/session-1") {
          return { ok: true, json: async () => ({ ok: true }) };
        }
        throw new Error(`Unexpected request: ${url}`);
      })
    );

    render(<TrainingWorkbench />);
    fireEvent.click(screen.getByRole("button", { name: "生成新题" }));

    await waitFor(() => expect(screen.getByRole("button", { name: /B\./ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /B\./ }));
    fireEvent.click(screen.getByRole("button", { name: "提交评分" }));

    await waitFor(() => expect(screen.getByText("答案解析")).toBeInTheDocument());
    expect(screen.getByText(/更优答案是 B/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "生成参考答案" })).not.toBeInTheDocument();
  });
});
