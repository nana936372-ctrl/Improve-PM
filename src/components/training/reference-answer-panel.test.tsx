import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReferenceAnswerPanel } from "./reference-answer-panel";

describe("ReferenceAnswerPanel", () => {
  it("renders reference answer sections", () => {
    render(
      <ReferenceAnswerPanel
        referenceAnswer={{
          outline: ["目标拆解"],
          sampleAnswer: "先明确用户与业务目标。",
          commonMistakes: ["只讲模型"],
          nextTrainingAdvice: "继续训练指标设计"
        }}
      />
    );
    expect(screen.getByText("参考答案与复盘")).toBeInTheDocument();
    expect(screen.getByText("目标拆解")).toBeInTheDocument();
  });
});
