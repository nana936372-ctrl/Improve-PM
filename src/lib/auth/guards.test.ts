import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock
}));

describe("auth guards", () => {
  beforeEach(() => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
      }
    });
  });

  it("returns null when Supabase server config is missing", async () => {
    createClientMock.mockRejectedValue(new Error("Missing Supabase server environment variables"));

    const { getCurrentUser } = await import("./guards");

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("redirects anonymous users to auth", async () => {
    const { requireUser } = await import("./guards");
    await expect(requireUser()).rejects.toThrow("redirect:/auth");
  });
});
