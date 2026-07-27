# AGENTS.md

Project-level instructions for AI agents working on Badil Atr (بديل عطر).

## Project Overview

Arabic-first perfume discovery platform. Next.js 16 App Router + Drizzle ORM + Neon Postgres (pgvector/pg_trgm). Arabic (RTL) is the default locale; English (LTR) is secondary.

## Essential Commands

```bash
pnpm install              # install dependencies
pnpm dev                  # start dev server (http://localhost:3000/ar)
pnpm build                # production build
pnpm typecheck            # tsc --noEmit (must pass before commit)
pnpm lint                 # eslint (must pass before commit)
pnpm test                 # vitest run (unit + integration)
pnpm test:watch           # vitest watch mode
pnpm test:coverage        # vitest with coverage (threshold: 70%)
pnpm test:e2e             # playwright E2E (auto-starts dev server)
pnpm db:push              # push schema to Neon
pnpm db:seed              # seed Arabic perfume data
pnpm db:health            # DB connectivity smoke test
pnpm db:generate          # generate migration from schema changes
```

## Pre-Commit Gates

All must pass before committing:
1. `pnpm typecheck` — zero errors
2. `pnpm lint` — zero errors
3. `pnpm test` — all tests pass

## Code Conventions

- **No comments** in code unless explicitly asked
- **TypeScript strict mode** — no `any`, handle null explicitly
- **Path alias** `@/*` → `./src/*` (never use relative imports that cross src/ boundary)
- **Explicit test imports**: `import { describe, it, expect } from 'vitest'` (no globals)
- **Prettier**: single quotes, trailing commas, 100 char width, 2-space indent
- **Conventional commits**: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full deep-dive. Key points:

- **App Router** with `[locale]` segment — pages in `src/app/[locale]/`
- **Server Components by default** — add `"use client"` only when needed (events, state, browser APIs)
- **Drizzle ORM** — schema in `src/server/db/schema/`, queries via `getDb()` lazy singleton in `src/server/db/client.ts`
- **next-intl** — config in `src/i18n/`, messages in `messages/{ar,en}.json`
- **shadcn/ui** — primitives in `src/components/ui/`, owned (not a dependency)
- **`buttonVariants`** extracted to `src/components/ui/button-variants.ts` (server-safe, no `"use client"`)

## Database

- **Neon PostgreSQL** with `pgvector` + `pg_trgm` extensions
- **7 tables**: users, brands, perfumes, notes, perfume_notes, alternatives, reviews
- **Note layer** (top/heart/base) lives on `perfume_notes` join table, not on `notes`
- **`perfumes.embedding`** is `vector(1536)` — nullable until AI Matching subsystem lands
- **Schema changes**: edit `src/server/db/schema/*.ts` → `pnpm db:generate` → review SQL → `pnpm db:push`

## Testing

- **Unit tests** co-located: `src/**/*.test.{ts,tsx}`
- **E2E tests** in `e2e/*.spec.ts`
- **happy-dom** environment for component tests
- **Coverage include**: `src/lib/**`, `src/components/ui/**`, `scripts/ingest/**`
- **No snapshot tests** — use explicit assertions
- **Test behavior, not implementation** — prefer `getByRole`/`getByText` over `getByTestId`

## Known Issues

- `pnpm test` exits code 1 when no test files match (expected Vitest behavior)
- Playwright may need `sudo pnpm exec playwright install-deps chromium` for OS shared libraries
- Network is slow in dev environment (~5-50 KiB/s) — `pnpm install` may need retries

## File Map

```
src/app/[locale]/     Pages and layouts (locale-segmented)
src/components/ui/    shadcn/ui primitives
src/components/       Shared components (header, footer, providers)
src/i18n/             next-intl config (routing, navigation, request)
src/lib/              Pure utilities (cn)
src/server/db/schema/ Drizzle schema definitions
src/server/db/        DB client + migrations
scripts/              CLI scripts (seed, health check)
e2e/                  Playwright E2E specs
messages/             Translation catalogs (ar.json, en.json)
docs/                 Documentation and specs
```
