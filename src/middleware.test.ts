// @vitest-environment node

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock
}));

describe("middleware", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    createServerClientMock.mockImplementation(() => {
      throw new Error("Supabase client should not be created without config");
    });
  });

  it("allows public auth page when Supabase config is missing", async () => {
    const { middleware } = await import("./middleware");

    const response = await middleware(new NextRequest("http://localhost/auth"));

    expect(response.status).toBe(200);
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("redirects protected pages to auth when Supabase config is missing", async () => {
    const { middleware } = await import("./middleware");

    const response = await middleware(new NextRequest("http://localhost/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/auth?next=%2Fdashboard");
    expect(createServerClientMock).not.toHaveBeenCalled();
  });
});
