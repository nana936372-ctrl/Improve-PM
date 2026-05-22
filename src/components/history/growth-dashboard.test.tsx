import { render, screen } from "@testing-library/react";
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
});
