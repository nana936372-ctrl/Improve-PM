import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FollowupPanel } from "./followup-panel";

describe("FollowupPanel", () => {
  it("shows answer input for unanswered latest turn", () => {
    render(
      <FollowupPanel
        turns={[{ question: "你会如何验证指标？", intent: "实验设计" }]}
        pendingAnswer=""
        onAnswerChange={vi.fn()}
        onSubmitAnswer={vi.fn()}
        onGenerateFollowup={vi.fn()}
        canGenerate
      />
    );
    expect(screen.getByPlaceholderText("回答这一轮追问...")).toBeInTheDocument();
  });
});
