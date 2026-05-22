import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrainingWorkbench } from "./training-workbench";

describe("TrainingWorkbench", () => {
  it("renders training controls", () => {
    render(<TrainingWorkbench />);
    expect(screen.getByRole("heading", { name: "训练配置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成新题" })).toBeInTheDocument();
  });
});
