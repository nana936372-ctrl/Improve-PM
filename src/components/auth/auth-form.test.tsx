import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "./auth-form";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/browser", () => ({
  createClient: createClientMock
}));

describe("AuthForm", () => {
  beforeEach(() => {
    createClientMock.mockReturnValue({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn()
    }
    });
  });

  it("renders login controls", () => {
    render(<AuthForm />);
    expect(screen.getByRole("heading", { name: "AI 产品经理思维训练器" })).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
  });

  it("shows setup guidance when Supabase browser config is missing", () => {
    createClientMock.mockImplementation(() => {
      throw new Error("Missing Supabase browser environment variables");
    });

    render(<AuthForm />);

    expect(screen.getByText("请先配置 Supabase 登录参数。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeDisabled();
  });
});
