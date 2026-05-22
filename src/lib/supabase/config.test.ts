import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveSupabasePublicConfig } from "./config";

describe("resolveSupabasePublicConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the publishable key when configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(resolveSupabasePublicConfig()).toEqual({
      url: "https://project.supabase.co",
      key: "publishable-key"
    });
  });

  it("falls back to the legacy anon key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(resolveSupabasePublicConfig()).toEqual({
      url: "https://project.supabase.co",
      key: "anon-key"
    });
  });

  it("returns null when url or key is missing", () => {
    expect(resolveSupabasePublicConfig()).toBeNull();
  });
});
