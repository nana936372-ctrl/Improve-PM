import { afterEach, describe, expect, it, vi } from "vitest";

import { createChatCompletion, resolveAiConfig } from "./client";

describe("resolveAiConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("prefers explicit config and trims a trailing base URL slash", () => {
    vi.stubEnv("AI_BASE_URL", "https://env.example/v1");
    vi.stubEnv("AI_API_KEY", "env-key");
    vi.stubEnv("AI_MODEL", "env-model");

    expect(
      resolveAiConfig({
        baseUrl: "https://provider.example/v1/",
        apiKey: "explicit-key",
        model: "explicit-model"
      })
    ).toEqual({
      baseUrl: "https://provider.example/v1",
      apiKey: "explicit-key",
      model: "explicit-model"
    });
  });
});

describe("createChatCompletion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts OpenAI-compatible JSON and returns assistant content", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "{\"ok\":true}" } }] })
    }));
    vi.stubGlobal("fetch", fetchMock);

    const content = await createChatCompletion([{ role: "user", content: "hello" }], {
      baseUrl: "https://provider.example/v1",
      apiKey: "test-key",
      model: "test-model"
    });

    expect(content).toBe("{\"ok\":true}");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://provider.example/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
        body: expect.stringContaining("\"model\":\"test-model\"")
      })
    );
  });
});
