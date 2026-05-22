import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("combines truthy class names and omits falsey values", () => {
    expect(cn("base", false && "hidden", undefined, "active")).toBe("base active");
  });
});
