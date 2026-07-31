import { expect, test } from "@playwright/test";

const SEARCH_HEADING = /نتائج البحث|Search results/;

test.describe("Search", () => {
  test("renders the search page with the query for a known term", async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto("/ar/search?q=oud", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: SEARCH_HEADING }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("searchbox")).toHaveValue(/oud/i);
  });

  test("renders the English search page in LTR", async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto("/en/search?q=oud", { waitUntil: "domcontentloaded" });
    expect(await page.getAttribute("html", "dir")).toBe("ltr");
    await expect(
      page.getByRole("heading", { level: 1, name: SEARCH_HEADING }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
