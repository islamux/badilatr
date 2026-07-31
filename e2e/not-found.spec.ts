import { expect, test } from "@playwright/test";

test.describe("Not found", () => {
  test("renders the 404 UI for an unknown perfume", async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto("/ar/perfumes/does-not-exist-xyz-123", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText("404").first()).toBeVisible({ timeout: 30_000 });
  });
});
