import { expect, test } from "@playwright/test";

test("auth page renders", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByRole("heading", { name: "AI 产品经理思维训练器" })).toBeVisible();
});
