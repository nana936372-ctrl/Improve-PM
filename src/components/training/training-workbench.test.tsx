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
});
