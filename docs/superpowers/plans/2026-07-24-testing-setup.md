# Testing Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add best-practice testing infrastructure (Vitest + RTL + Playwright) with an initial suite of 4 test files covering utilities, components, seed data integrity, and E2E landing flows.

**Architecture:** Vitest 3 runs unit/integration tests in a happy-dom environment with React Testing Library and jest-dom matchers. Playwright runs E2E browser tests against a `next dev` server. Tests are co-located next to source; E2E specs live in a top-level `e2e/` directory. Coverage is measured via V8 instrumentation with 70% thresholds scoped to the testable surface area (pure logic + components + seed data), excluding server-only, config, and page-layer code.

**Tech Stack:** Vitest 3, @vitejs/plugin-react, happy-dom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, @vitest/coverage-v8, Playwright

## Global Constraints

- TypeScript strict mode (existing `tsconfig.json`)
- Path alias `@/*` → `./src/*` (existing `tsconfig.json:22`)
- pnpm package manager
- Explicit test imports (no global vitest globals) — `import { describe, it, expect } from 'vitest'`
- ESLint flat config (existing `eslint.config.mjs`)
- No comments in code unless asked
- JSX transform: `react-jsx` (existing tsconfig)

---

### Task 1: Install Dependencies and Create Config Files

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Modify: `package.json` (scripts)
- Modify: `eslint.config.mjs` (ignore e2e dir from unit linting)
- Modify: `.gitignore` (playwright artifacts)

**Interfaces:**
- Produces: `vitest.config.ts` exporting default config consumed by Vitest CLI
- Produces: `vitest.setup.ts` consumed by `vitest.config.ts` setupFiles — the `@testing-library/jest-dom/vitest` import here provides both runtime matchers AND TypeScript type augmentation globally
- Produces: `playwright.config.ts` exporting default config consumed by Playwright CLI

**Note on types:** Do NOT add a `"types"` array to `tsconfig.json` — it would restrict auto-included `@types/*` packages and break typecheck. The jest-dom matchers (`toBeInTheDocument`, etc.) get their types from the `@testing-library/jest-dom/vitest` import in `vitest.setup.ts`, which is compiled as part of the project and applies its module augmentation globally.

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
pnpm add -D vitest @vitejs/plugin-react happy-dom @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/coverage-v8 @playwright/test
```
Expected: All packages installed, `package.json` devDependencies updated. If `ERR_PNPM_IGNORED_BUILDS` appears, run `pnpm approve-builds --all` then re-run.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.{test,spec}.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["src/lib/**", "src/components/ui/**", "scripts/seed-data.ts"],
      exclude: ["**/*.test.*", "**/*.spec.*", "**/*.d.ts"],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }

  if (!window.IntersectionObserver) {
    window.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(),
    }));
  }
}
```

- [ ] **Step 4: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 5: Add test scripts to `package.json`**

In `package.json`, add these scripts after the existing `"lint": "eslint",` line:

Find:
```json
    "lint": "eslint",
```
Replace with:
```json
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
```

- [ ] **Step 6: Update `.gitignore` — add Playwright artifacts**

Add to the end of `.gitignore`:

```
# playwright
/playwright-report/
/playwright/.cache/
/test-results/
```

- [ ] **Step 7: Update `eslint.config.mjs` — ignore Playwright E2E dir**

The Next.js ESLint config should not lint Playwright test files (they use different conventions). Add `"e2e/**"` to the `globalIgnores` array.

Find:
```js
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
```
Replace with:
```js
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright E2E tests (linted separately if needed)
    "e2e/**",
    // Test config
    "vitest.setup.ts",
    "playwright.config.ts",
  ]),
```

- [ ] **Step 8: Install Playwright browser binaries**

Run:
```bash
pnpm exec playwright install --with-deps chromium
```
Expected: Chromium browser downloaded. If system deps fail, re-run without `--with-deps`.

- [ ] **Step 9: Verify Vitest runs with no test files**

Run:
```bash
pnpm test 2>&1
```
Expected: Vitest runs, reports "No test files found" or passes with zero tests. No crash or config error.

- [ ] **Step 10: Verify typecheck still passes**

Run:
```bash
pnpm typecheck 2>&1
```
Expected: Zero errors.

- [ ] **Step 11: Verify lint still passes**

Run:
```bash
pnpm lint 2>&1
```
Expected: Zero errors.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: add Vitest + Playwright testing infrastructure

Vitest 3 with happy-dom, React Testing Library, jest-dom matchers.
Playwright with Chromium, auto-starts next dev.
70% coverage thresholds scoped to lib/components/seed-data."
```

---

### Task 2: Unit Test — cn() Utility

**Files:**
- Create: `src/lib/utils.test.ts`

**Interfaces:**
- Tests: `cn(...inputs: ClassValue[]): string` from `src/lib/utils.ts:4`
- Behavior: merges clsx (conditional classes) + tailwind-merge (conflict resolution)

- [ ] **Step 1: Write the test file**

```ts
import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges plain class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts (later wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("resolves color conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays", () => {
    expect(cn(["px-2", "py-1"], "mx-auto")).toBe("px-2 py-1 mx-auto");
  });

  it("handles objects (clsx syntax)", () => {
    expect(cn({ active: true, disabled: false }, "extra")).toBe(
      "active extra"
    );
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run:
```bash
pnpm test src/lib/utils.test.ts 2>&1
```
Expected: 7 tests pass, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.test.ts
git commit -m "test: add cn() utility unit tests"
```

---

### Task 3: Component Test — Button

**Files:**
- Create: `src/components/ui/button.test.tsx`

**Interfaces:**
- Tests: `Button` from `src/components/ui/button.tsx:45`
- Props: extends `React.ButtonHTMLAttributes<HTMLButtonElement>`, adds `variant`, `size`, `asChild`
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`
- `buttonVariants` function from `src/components/ui/button.tsx:9` (for class assertion)

- [ ] **Step 1: Write the test file**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, buttonVariants } from "@/components/ui/button";

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass(
      ...buttonVariants({ variant: "default", size: "default" }).split(" ")
    );
  });

  it.each([
    ["destructive"],
    ["outline"],
    ["secondary"],
    ["ghost"],
    ["link"],
  ] as const)("renders %s variant with correct classes", (variant) => {
    render(<Button variant={variant}>Text</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("inline-flex");
  });

  it.each(["sm", "lg", "icon"] as const)(
    "renders %s size",
    (size) => {
      render(<Button size={size}>Text</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    }
  );

  it("fires onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Click
      </Button>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards asChild to render a child anchor", () => {
    render(
      <Button asChild>
        <a href="/perfumes">Link button</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: "Link button" });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe("A");
  });

  it("passes through data-testid and aria-label", () => {
    render(
      <Button data-testid="submit-btn" aria-label="Submit form">
        Go
      </Button>
    );
    expect(screen.getByTestId("submit-btn")).toHaveAttribute(
      "aria-label",
      "Submit form"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run:
```bash
pnpm test src/components/ui/button.test.tsx 2>&1
```
Expected: All tests pass (1 default + 5 variants + 3 sizes + onClick + disabled + asChild + props = 12 tests).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/button.test.tsx
git commit -m "test: add Button component tests (variants, sizes, asChild, events)"
```

---

### Task 4: Data Integrity Test — Seed Data

**Files:**
- Create: `scripts/seed-data.test.ts`

**Interfaces:**
- Tests exports from `scripts/seed-data.ts`:
  - `seedBrands: SeedBrand[]` (line 34) — `{ name, slug, country, foundedYear, type, description }`
  - `seedNotes: SeedNote[]` (line 109) — `{ name, slug }`
  - `seedPerfumes: SeedPerfume[]` (line 139) — `{ name, slug, brandSlug, releaseYear, perfumer, gender, concentration, family, description, notes: SeedPerfumeNote[] }`
- `SeedPerfumeNote` — `{ slug: string; layer: "top" | "heart" | "base" }`

- [ ] **Step 1: Write the test file**

```ts
import { describe, expect, it } from "vitest";

import {
  seedBrands,
  seedNotes,
  seedPerfumes,
  type NoteLayer,
} from "./seed-data";

const VALID_LAYERS: NoteLayer[] = ["top", "heart", "base"];

describe("seedBrands", () => {
  it("has at least 8 brands", () => {
    expect(seedBrands.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique slugs", () => {
    const slugs = seedBrands.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all brands are type 'arabic' in phase 1", () => {
    for (const brand of seedBrands) {
      expect(brand.type).toBe("arabic");
    }
  });

  it("all brands have non-empty names and descriptions", () => {
    for (const brand of seedBrands) {
      expect(brand.name.length).toBeGreaterThan(0);
      expect(brand.description.length).toBeGreaterThan(10);
    }
  });
});

describe("seedNotes", () => {
  it("has at least 20 notes", () => {
    expect(seedNotes.length).toBeGreaterThanOrEqual(20);
  });

  it("has unique slugs", () => {
    const slugs = seedNotes.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("seedPerfumes", () => {
  it("has at least 8 perfumes", () => {
    expect(seedPerfumes.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique slugs", () => {
    const slugs = seedPerfumes.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every perfume references a valid brand slug", () => {
    const brandSlugs = new Set(seedBrands.map((b) => b.slug));
    for (const perfume of seedPerfumes) {
      expect(brandSlugs).toContain(perfume.brandSlug);
    }
  });

  it("every perfume has at least 3 notes", () => {
    for (const perfume of seedPerfumes) {
      expect(perfume.notes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every note reference resolves to a defined note", () => {
    const noteSlugs = new Set(seedNotes.map((n) => n.slug));
    for (const perfume of seedPerfumes) {
      for (const note of perfume.notes) {
        expect(noteSlugs).toContain(note.slug);
      }
    }
  });

  it("every note layer is a valid enum value", () => {
    for (const perfume of seedPerfumes) {
      for (const note of perfume.notes) {
        expect(VALID_LAYERS).toContain(note.layer);
      }
    }
  });

  it("every perfume has at least one top and one base note", () => {
    for (const perfume of seedPerfumes) {
      const layers = perfume.notes.map((n) => n.layer);
      expect(layers).toContain("top");
      expect(layers).toContain("base");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run:
```bash
pnpm test scripts/seed-data.test.ts 2>&1
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-data.test.ts
git commit -m "test: add seed data integrity tests (slugs, refs, note pyramids)"
```

---

### Task 5: E2E Test — Landing Page

**Files:**
- Create: `e2e/landing.spec.ts`

**Interfaces:**
- Tests the running Next.js dev server at `http://localhost:3000`
- Assertions on:
  - URL redirect: `/` → `/ar`
  - `<html dir="rtl">` for Arabic, `<html dir="ltr">` for English
  - Hero title text from `messages/ar.json:Landing.title` = "اعثر على بديل عطرك المثالي"
  - Hero title text from `messages/en.json:Landing.title` = "Find your perfect perfume alternative"
  - Locale switcher button text from `messages/ar.json:Locale.switch` = "English"

- [ ] **Step 1: Create the `e2e/` directory**

Run:
```bash
mkdir -p e2e
```

- [ ] **Step 2: Write the E2E spec**

```ts
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
```

- [ ] **Step 3: Run E2E tests**

Run:
```bash
pnpm test:e2e 2>&1
```
Expected: Playwright starts the dev server (or reuses existing), runs 5 tests in Chromium, all pass.

- [ ] **Step 4: Commit**

```bash
git add e2e/landing.spec.ts
git commit -m "test: add Playwright E2E landing page tests (locale, RTL/LTR, hero)"
```

---

### Task 6: Coverage Gate and Final Verification

**Files:**
- No new files. Verification-only task.

- [ ] **Step 1: Run full test suite with coverage**

Run:
```bash
pnpm test:coverage 2>&1
```
Expected: All unit tests pass. Coverage report shows ≥ 70% across statements, branches, functions, lines for the included files (`src/lib/**`, `src/components/ui/**`, `scripts/seed-data.ts`).

- [ ] **Step 2: Run typecheck**

Run:
```bash
pnpm typecheck 2>&1
```
Expected: Zero errors.

- [ ] **Step 3: Run lint**

Run:
```bash
pnpm lint 2>&1
```
Expected: Zero errors.

- [ ] **Step 4: Run E2E suite one final time**

Run:
```bash
pnpm test:e2e 2>&1
```
Expected: All 5 E2E tests pass.

- [ ] **Step 5: If any file changes were needed during verification, commit them**

```bash
git status
# If changes exist:
git add -A && git commit -m "chore: fix verification issues from testing setup"
```

- [ ] **Step 6: Push branch and create PR (if not already on a feature branch)**

```bash
git push origin main
```

---

## Post-Implementation Notes

- **Coverage scope:** The `coverage.include` in `vitest.config.ts` is intentionally narrow (`src/lib/**`, `src/components/ui/**`, `scripts/seed-data.ts`). As features land (search, auth, reviews), expand this list and write corresponding tests before raising thresholds.
- **Ratchling:** Never lower the 70% threshold without explicit discussion. Raise it as coverage improves.
- **CI integration (future):** In CI, run `pnpm test:coverage` and `pnpm test:e2e` as separate jobs. Playwright in CI uses `retries: 2` and `workers: 1` (already configured).
- **Component coverage gap:** Badge, Card, Input, Skeleton, Separator are not individually tested but are trivial passthrough components. If coverage on `src/components/ui/**` falls below 70%, add quick smoke tests for these in a future task.
