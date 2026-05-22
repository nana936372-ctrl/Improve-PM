import { z } from "zod";
import { describe, expect, it } from "vitest";

import { extractJsonObject, parseAiJson } from "./json";

describe("AI JSON helpers", () => {
  it("extracts fenced JSON", () => {
    expect(extractJsonObject("```json\n{\"ok\":true}\n```")).toBe("{\"ok\":true}");
  });

  it("parses with schema", () => {
    const result = parseAiJson("{\"ok\":true}", z.object({ ok: z.boolean() }));
    expect(result.ok).toBe(true);
  });
});
