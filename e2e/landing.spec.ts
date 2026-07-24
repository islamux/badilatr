import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
  test("redirects / to /ar with RTL direction", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar$/);
    const dir = await page.getAttribute("html", "dir");
    expect(dir).toBe("rtl");
  });

  test("displays Arabic hero title by default", async ({ page }) => {
    await page.goto("/ar");
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toHaveText("اعثر على بديل عطرك المثالي");
  });

  test("shows 4 coming-soon shelf sections", async ({ page }) => {
    await page.goto("/ar");
    const sections = page.getByRole("heading", { level: 2 });
    await expect(sections).toHaveCount(4);
  });

  test("locale switcher navigates to English and flips to LTR", async ({
    page,
  }) => {
    await page.goto("/ar");
    const switchBtn = page.getByRole("button", { name: "English" });
    await switchBtn.click();
    await expect(page).toHaveURL(/\/en$/);
    const dir = await page.getAttribute("html", "dir");
    expect(dir).toBe("ltr");
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toHaveText("Find your perfect perfume alternative");
  });

  test("direct visit to /en renders English with LTR", async ({ page }) => {
    await page.goto("/en");
    const dir = await page.getAttribute("html", "dir");
    expect(dir).toBe("ltr");
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toContainText("perfect perfume alternative");
  });
});
