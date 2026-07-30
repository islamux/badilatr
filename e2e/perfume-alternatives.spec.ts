import { expect, test, type Page } from "@playwright/test";

const ALT_HEADING_AR = "بدائل مشابهة";
const ALT_HEADING_EN = "Similar alternatives";

const KNOWN_SLUGS = ["armaf-nomad-pour-homme", "mugler-angel", "armaf-shk-iv"];

async function headingAppears(page: Page, heading: string, timeout = 15000): Promise<boolean> {
  try {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function openPerfumeWithAlternatives(
  page: Page,
  locale: "ar" | "en",
  heading: string,
): Promise<boolean> {
  for (const slug of KNOWN_SLUGS) {
    const resp = await page.goto(`/${locale}/perfumes/${slug}`, {
      waitUntil: "domcontentloaded",
    });
    if (!resp || !resp.ok()) continue;
    if (await headingAppears(page, heading)) return true;
  }
  return false;
}

test.describe("Perfume alternatives (Original VS Alternative)", () => {
  test("surfaces ranked alternatives with score badges in Arabic (RTL)", async ({ page }) => {
    test.setTimeout(180_000);

    const found = await openPerfumeWithAlternatives(page, "ar", ALT_HEADING_AR);
    expect(found, "a perfume with alternatives must render").toBe(true);
    expect(await page.getAttribute("html", "dir")).toBe("rtl");

    const section = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { level: 2, name: ALT_HEADING_AR }) });
    const cards = section.getByRole("link");
    await expect(cards.first()).toBeVisible();
    await expect(cards.first()).toContainText(/\d+%/);

    const scores = await cards.evaluateAll((els) =>
      els
        .map((e) => (e.textContent ?? "").match(/(\d+)%/)?.[1] ?? "")
        .filter(Boolean)
        .map(Number),
    );
    expect(scores.length).toBeGreaterThan(0);
    for (let i = 1; i < scores.length; i += 1) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }

    await expect(page.getByText("الاختلافات").first()).toBeVisible();
  });

  test("renders the English alternatives heading in LTR", async ({ page }) => {
    test.setTimeout(180_000);

    const found = await openPerfumeWithAlternatives(page, "en", ALT_HEADING_EN);
    expect(found, "a perfume with alternatives must render").toBe(true);
    expect(await page.getAttribute("html", "dir")).toBe("ltr");
  });
});
