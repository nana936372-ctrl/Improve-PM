import { describe, expect, it } from "vitest";

import { isCompleteAiConfig } from "./ai-config";

describe("isCompleteAiConfig", () => {
  it("requires baseUrl apiKey and model", () => {
    expect(isCompleteAiConfig({ baseUrl: "x", apiKey: "y", model: "z" })).toBe(true);
    expect(isCompleteAiConfig({ baseUrl: "x", model: "z" })).toBe(false);
  });
});
