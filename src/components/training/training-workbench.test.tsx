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
});
