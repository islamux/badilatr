# Testing Setup Design

**Date:** 2026-07-24
**Status:** Approved
**Scope:** Add best-practice testing infrastructure (unit/integration + E2E) to the Badil Atr platform.

## Context

The project is a Next.js 16 + TypeScript + Tailwind v4 + Drizzle ORM app with an Arabic-first i18n layer (next-intl), a luxury design system (shadcn/ui primitives), a 7-table Postgres schema (Neon + pgvector), and seed scripts. No testing dependencies exist yet.

The app will grow to include search, AI matching, reviews, auth, and admin features. Establishing testing infrastructure now prevents regressions as complexity increases.

## Goals

- Fast unit/integration tests for logic, data integrity, and component rendering.
- Reliable E2E tests for real browser flows (rendering, navigation, locale switching).
- Coverage enforcement so quality doesn't erode over time.
- Minimal friction: co-located tests, single command to run everything.

## Non-Goals

- Database integration tests (deferred until Neon is wired with `DATABASE_URL`).
- Auth/admin tests (features not yet built).
- Snapshot tests (explicit assertions only — snapshots are brittle for UI).
- Visual regression testing.

## Tooling

| Layer | Tool | Rationale |
|---|---|---|
| Runner | Vitest 3 | ESM-native, Vite-powered (fast), zero-config TS/Next.js compat, Jest-compatible API |
| DOM env | happy-dom | 2-3x faster than jsdom, sufficient for RTL component tests |
| Components | @testing-library/react | De-facto standard; tests behavior over implementation |
| Matchers | @testing-library/jest-dom | Semantic DOM matchers (`toBeInTheDocument`, `toHaveTextContent`) |
| Coverage | @vitest/coverage-v8 | Native V8 instrumentation, no babel transform overhead |
| E2E | Playwright | Cross-browser, auto-wait, trace viewer, Next.js-aware `webServer` config |

## Configuration

### `vitest.config.ts`
- `environment: 'happy-dom'`
- `setupFiles: ['./vitest.setup.ts']`
- `coverage.provider: 'v8'`
- Coverage thresholds: 70% on statements, branches, functions, lines
- `include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.{test,spec}.ts']`
- Path alias `@/*` resolved via Vite `resolve.alias` to `./src`

### `vitest.setup.ts`
- Import `@testing-library/jest-dom/vitest`
- Global mocks: `IntersectionObserver`, `window.matchMedia` (needed by next-themes / Radix)

### `playwright.config.ts`
- `testDir: './e2e'`
- `webServer: { command: 'next dev', port: 3000, reuseExistingServer: true }`
- Projects: Chromium first (Firefox/WebKit can be added later)
- `baseURL: 'http://localhost:3000'`

## Directory Structure

```
vitest.config.ts
vitest.setup.ts
playwright.config.ts
src/
  lib/utils.test.ts                  # cn() class merging
  components/ui/button.test.tsx      # variants, sizes, asChild forwarding
  server/db/schema/index.test.ts     # schema shape sanity (tables, relations exported)
scripts/
  seed-data.test.ts                  # data integrity: unique slugs, valid note layers, brand refs
e2e/
  landing.spec.ts                    # page loads, Arabic default (RTL), hero text, locale switch to EN
```

## pnpm Scripts

| Script | Command |
|---|---|
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `test:e2e` | `playwright test` |
| `test:e2e:ui` | `playwright test --ui` |

## Initial Test Suite

### 1. `src/lib/utils.test.ts`
- `cn()` merges class names
- `cn()` handles conditional classes (clsx behavior)
- `cn()` merges Tailwind conflicts (tailwind-merge behavior)

### 2. `src/components/ui/button.test.tsx`
- Renders default variant
- Renders all variants with correct classes
- Renders all sizes
- Forwards `asChild` to child element (Slot)
- Forwards props (onClick, disabled)

### 3. `scripts/seed-data.test.ts`
- All perfume slugs are unique
- All brand slugs are unique
- Every perfume's `brandId` resolves to a defined brand
- Every perfume note reference resolves to a defined note
- Note layers (top/heart/base) are valid enum values
- Similarity scores (where present) are within 0-100

### 4. `e2e/landing.spec.ts`
- Page loads with 200 status
- Default locale is Arabic (`/ar`), document direction is `rtl`
- Hero heading text is present
- Locale switcher toggles to English (`/en`), direction becomes `ltr`

## Coverage Strategy

- **Baseline:** 70% across all four metrics (statements, branches, functions, lines).
- **Ratchet:** Increase thresholds as features land. Never decrease without explicit discussion.
- **Exclude from coverage:** config files (`*.config.*`), setup files (`*.setup.*`), type-only files (`*.d.ts`), `next-env.d.ts`.

## Dependencies

**devDependencies (all):**
- `vitest`, `@vitejs/plugin-react`, `happy-dom`
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `@vitest/coverage-v8`
- `@playwright/test`
- `jsdom` (only if happy-dom proves insufficient for a specific case)

## Verification

After implementation:
1. `pnpm test` — all unit/integration tests pass, coverage ≥ 70%
2. `pnpm test:e2e` — Playwright launches dev server, all E2E specs pass
3. `pnpm typecheck` — still clean (test files are typed)
4. `pnpm lint` — still clean
