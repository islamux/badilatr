# Session State — Badil Atr (بديل عطر)

**Last updated:** 2026-07-24
**Branch:** `main` (all work merged)
**Repo:** https://github.com/islamux/badilatr

---

## Project Overview

Arabic-first perfume discovery platform. Next.js 16 + Drizzle ORM + Neon Postgres (pgvector/pg_trgm). Arabic (RTL) default, English (LTR) secondary.

## Completed Milestones

### 1. Foundation Layer (PR #1, #2)
- Next.js 16.2.11, TypeScript strict, Tailwind v4, ESLint 9, Prettier
- Luxury design system (Obsidian/Gold/Champagne palette, dark/light themes)
- Cairo (Arabic) + Inter (Latin) fonts
- shadcn/ui primitives: Button, Card, Badge, Input, Skeleton, Separator
- `buttonVariants` extracted to server-safe `button-variants.ts` (fixes RSC Slot crash)
- next-intl i18n: `[locale]` routing, `localeDetection: false`, RTL/LTR
- Landing page: hero + 4 shelf sections + search bar
- Site chrome: header (locale switcher + theme toggle), footer
- Drizzle ORM schema: 7 tables (users, brands, perfumes, notes, perfume_notes, alternatives, reviews)
  - pgvector `embedding vector(1536)` with HNSW index
  - pg_trgm GIN indexes on names
  - Note layer on `perfume_notes` join table
  - Migration: `0000_initial.sql`
- Seed data: 8 Arabic houses, 24 notes, 8 perfumes
- DB scripts: `db:push`, `db:seed`, `db:health`, `db:generate`, `db:migrate`, `db:studio`

### 2. Testing Infrastructure (PR #2)
- Vitest 4 + React Testing Library + jest-dom + happy-dom
- Playwright E2E with Chromium (auto-starts dev server)
- 46 unit/integration tests (100% coverage on included files)
- 5 Playwright E2E tests (locale redirect, RTL/LTR, hero rendering, locale switch)
- 70% coverage thresholds (currently 100%)
- Coverage scope: `src/lib/**`, `src/components/ui/**`, `scripts/seed-data.ts`

### 3. Professional Documentation (PR #3)
- README.md: badges, features, tech stack, quickstart, full scripts table, project structure, roadmap
- ARCHITECTURE.md: system diagrams (ASCII), tech stack rationale, data model (ERD), i18n flow, design tokens, testing strategy
- CONTRIBUTING.md: dev setup, code style, testing, commit conventions, PR workflow
- CHANGELOG.md: Keep a Changelog format, v0.1.0
- LICENSE: GPL-3.0
- package.json: metadata (description, license, repository, author)
- `data-base-plan.md` moved to `docs/`

### 4. AGENTS.md + Graphify (PR #4)
- AGENTS.md: project-level instructions for AI agents
- Graphify AST index built: 63 files, 83 symbols, 37 relationships

### 5. Data Ingestion Pipeline (PR #5)
- Python scraping pipeline for Arabic perfume houses
- Shopify scraper (Afnan, Armaf): `/products.json` + PDP note parsing
- Salla scraper (Rasasi, Ibraq): sitemap discovery + JSON-LD (needs Playwright for JS pages)
- WooCommerce scraper (Lattafa): scaffolded (needs sitemap URL discovery)
- Pydantic models mirroring Drizzle schema
- Phase 1 result: 10 Afnan perfumes scraped, 73 notes, 7 with full top/heart/base pyramids

---

## Current State

### App Status
- `pnpm dev` → working (http://localhost:3000/ar, 200 OK)
- `pnpm test` → 46 tests pass, 100% coverage
- `pnpm test:e2e` → 5 tests pass
- `pnpm typecheck` → clean
- `pnpm lint` → clean (0 errors, 0 warnings)
- `pnpm build` → both locales prerendered

### Database Status
- **NOT CONNECTED** — `.env` has placeholder values (`host.neon.tech`, `user`, `dbname`)
- Schema, migrations, seed scripts are ready but untested against live DB
- To connect: create Neon project → set DATABASE_URL → `pnpm db:push && pnpm db:health && pnpm db:seed`

### Scraped Data
- JSON output in `scripts/scrape/output/` (gitignored)
- 10 Afnan perfumes with 73 notes in `afnan.json` and `merged.json`
- TypeScript import script (JSON → Drizzle) NOT YET WRITTEN

---

## What's NOT Done Yet

### High Priority
1. **Wire Neon database** — user needs to create Neon project, set DATABASE_URL, run db:push/seed
2. **TypeScript import script** — read `scripts/scrape/output/merged.json` → Drizzle ORM inserts (idempotent, slug-based)
3. **Rasasi scraper with Playwright** — Salla pages are JS-rendered, need headless browser
4. **Lattafa scraper** — WooCommerce sitemap discovery for Arabic product slugs

### Medium Priority
5. **Search Engine** (Phase 2) — full-text search, pg_trgm fuzzy, pgvector semantic similarity
6. **Perfume/Brand detail pages** — olfactory pyramid, performance charts, alternatives comparison
7. **AI Matching Engine** — embedding generation pipeline, similarity ranking
8. **Reviews** — ratings, longevity/projection/sillage metrics, community voting
9. **Auth + Admin** — Better Auth, RBAC (Admin/Moderator/User), CMS dashboard

### Low Priority
10. **Deployment** — Vercel, CI/CD pipeline, Lighthouse optimization
11. **Armaf scraping** — scraper is ready, just run `python scraper.py 10 Armaf`
12. **3itr editorial enrichment** — WordPress blog, perfume articles/descriptions

---

## Key Files

### Configuration
- `package.json` — deps, scripts (db:*, test:*, typecheck)
- `tsconfig.json` — strict, path alias `@/*` → `./src/*`
- `next.config.ts` — next-intl plugin
- `drizzle.config.ts` — schema path, migrations output
- `vitest.config.ts` — happy-dom, coverage thresholds
- `playwright.config.ts` — Chromium, webServer auto-start
- `.prettierrc` — single quotes, trailing commas, 100 width
- `eslint.config.mjs` — next core-web-vitals + typescript, ignores e2e/coverage
- `pnpm-workspace.yaml` — onlyBuiltDependencies for native deps

### Schema & DB
- `src/server/db/schema/` — enums, users, brands, perfumes, notes, alternatives, reviews, relations
- `src/server/db/client.ts` — lazy Neon singleton `getDb()`
- `src/server/db/migrations/0000_initial.sql` — full schema + extensions + indexes
- `scripts/seed-data.ts` — 8 brands, 24 notes, 8 perfumes
- `scripts/seed.ts` — idempotent seeding
- `scripts/db-health.ts` — extension check + write round-trip

### App & UI
- `src/app/[locale]/layout.tsx` — fonts, RTL/LTR, providers, metadata
- `src/app/[locale]/page.tsx` — landing page (hero + shelves)
- `src/app/globals.css` — design tokens, Tailwind v4 theme
- `src/components/ui/` — button, button-variants, badge, card, input, skeleton, separator
- `src/components/` — site-header, site-footer, providers, theme-toggle, locale-switcher
- `src/i18n/` — routing, navigation, request
- `src/proxy.ts` — next-intl middleware
- `messages/{ar,en}.json` — translation catalogs

### Tests
- `src/lib/utils.test.ts` — cn() tests (7)
- `src/components/ui/button.test.tsx` — Button tests (13)
- `src/components/ui/primitives.test.tsx` — Badge/Card/Input/Skeleton/Separator (13)
- `scripts/seed-data.test.ts` — data integrity (13)
- `e2e/landing.spec.ts` — Playwright E2E (5)

### Scraper
- `scripts/scrape/scraper.py` — orchestrator
- `scripts/scrape/models.py` — Pydantic models
- `scripts/scrape/sites/base.py` — BaseScraper (httpx, rate limit, retry)
- `scripts/scrape/sites/shopify.py` — Shopify scraper (Afnan, Armaf)
- `scripts/scrape/sites/salla.py` — Salla scraper (Rasasi, Ibraq)
- `scripts/scrape/requirements.txt` — httpx, bs4, pydantic, lxml

### Docs
- `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE`
- `AGENTS.md` — AI agent instructions
- `docs/spec/badilatr.md` — original product brief
- `docs/superpowers/specs/` — design specs
- `docs/superpowers/plans/` — implementation plans

---

## Known Issues

1. **DB not wired** — all DB scripts ready but `.env` has placeholders
2. **Rasasi scraper needs Playwright** — Salla pages are client-rendered
3. **`pnpm test` exits code 1 with no test files** — expected Vitest behavior
4. **Playwright OS deps** — may need `sudo pnpm exec playwright install-deps chromium`
5. **Network slow in dev** — ~5-50 KiB/s, `pnpm install` may need retries
6. **3 Afnan perfumes have no notes** — Malak, Ebdaa, 9 PM Night Out (JS-rendered or different layout)

---

## PRs Merged

| # | Title | Branch |
|---|---|---|
| 1 | chore: add Prettier config | feat/foundation |
| 2 | feat: add testing infrastructure (Vitest + RTL + Playwright) | feat/testing-setup |
| 3 | docs: professional documentation suite | docs/professional-docs |
| 4 | chore: add AGENTS.md + graphify AST index | chore/agents-md-graphify |
| 5 | feat: Python scraping pipeline for Arabic perfume houses | feat/data-ingestion |

---

## Resume Instructions

To pick up where we left off:

1. **Connect the database:**
   ```bash
   cp .env.example .env  # set real Neon DATABASE_URL
   pnpm db:push && pnpm db:health && pnpm db:seed
   ```

2. **Write the TypeScript import script** for scraped data:
   - Read `scripts/scrape/output/merged.json`
   - Insert brands, notes, perfumes, perfume_notes via Drizzle ORM
   - Idempotent (slug-based `onConflictDoNothing`)

3. **Expand scraping:**
   ```bash
   cd scripts/scrape && source .venv/bin/activate
   python scraper.py 10 Armaf     # add Armaf perfumes
   # For Rasasi: install playwright, write JS-rendered scraper
   ```

4. **Start Phase 2 (Search Engine):**
   - Full-text search on perfume/brand names
   - pg_trgm fuzzy matching
   - pgvector semantic similarity (needs embeddings)
