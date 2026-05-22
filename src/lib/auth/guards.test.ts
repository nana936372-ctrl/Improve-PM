import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null })
    }
  }))
}));

describe("requireUser", () => {
  it("redirects anonymous users to auth", async () => {
    const { requireUser } = await import("./guards");
    await expect(requireUser()).rejects.toThrow("redirect:/auth");
  });
});
