# Badil Atr · بديل عطر

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-4.x-6E9F18?logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.x-2EAD33?logo=playwright)](https://playwright.dev/)

> A premium Arabic-first perfume discovery platform — the "IMDb + recommendation engine for fragrances." Find the closest alternative to your favorite luxury scent with transparent similarity scoring.

---

## Features

- **Arabic-first i18n** — RTL default locale with full English (LTR) support via next-intl
- **Luxury design system** — Obsidian/Gold/Champagne palette, dark/light themes, Cairo + Inter fonts
- **Typed database schema** — 7-table PostgreSQL model with pgvector semantic search and pg_trgm fuzzy matching
- **Comprehensive testing** — Vitest unit/integration (100% coverage) + Playwright E2E browser tests
- **SEO-ready** — Locale-aware metadata, static prerendering for both locales

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, RSC) | Server Components, streaming, Turbopack |
| Language | TypeScript (strict) | Type safety end-to-end |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first, accessible primitives |
| i18n | next-intl | Locale routing, message loading, RTL/LTR |
| Database | PostgreSQL (Neon) + pgvector | Serverless Postgres with vector similarity search |
| ORM | Prisma ORM (`@prisma/adapter-pg`) | Type-safe client, driver adapters, declarative schema-as-code migrations |
| Testing | Vitest + Playwright | Fast unit tests, cross-browser E2E |
| Auth | Better Auth (planned) | Edge-compatible, session management |

## Quickstart

### Prerequisites

- Node.js 18+
- pnpm 9+
- A [Neon](https://neon.tech) PostgreSQL project (free tier works)

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your Neon pooled connection string (with `?sslmode=require`).

### 3. Set up the database

```bash
pnpm db:push      # push Prisma schema to Neon (prisma db push)
pnpm db:health    # verify extensions + connectivity
pnpm db:seed      # seed perfume data via FragDB ingest (scripts/ingest/seed.ts)
```

### 4. Run

```bash
pnpm dev
```

Open <http://localhost:3000/ar> (Arabic, default) or <http://localhost:3000/en>.

### 5. Test

```bash
pnpm test           # unit + integration (46 tests)
pnpm test:coverage  # with coverage report (100%)
pnpm test:e2e       # Playwright browser tests (5 tests)
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript compiler check (`tsc --noEmit`) |
| `pnpm test` | Run Vitest once |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:coverage` | Vitest with V8 coverage report |
| `pnpm test:e2e` | Playwright E2E tests (auto-starts dev server) |
| `pnpm test:e2e:ui` | Playwright interactive UI mode |
| `pnpm db:generate` | Generate Prisma Client (`prisma generate`) |
| `pnpm db:push` | Push schema directly to database (`prisma db push`) |
| `pnpm db:migrate` | Apply generated migrations (`prisma migrate deploy`) |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) |
| `pnpm db:seed` | Seed perfume data via FragDB ingest |
| `pnpm db:reset` | Wipe links/perfumes/notes/brands (reviews/alternatives cascade) |
| `pnpm db:health` | Database connectivity smoke test |

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Locale-segmented routes (layout + landing page)
│   │   ├── layout.tsx     # Root layout: fonts, RTL/LTR, providers, metadata
│   │   └── page.tsx       # Landing page: hero + shelf sections
│   ├── globals.css        # Design tokens, Tailwind v4 theme, dark/light
│   └── favicon.ico
├── components/
│   ├── ui/                # shadcn/ui primitives (button, card, badge, …)
│   ├── site-header.tsx    # Nav bar with locale switcher + theme toggle
│   ├── site-footer.tsx
│   ├── providers.tsx      # ThemeProvider (next-themes)
│   ├── theme-toggle.tsx
│   └── locale-switcher.tsx
├── features/              # Feature modules (seams for future work)
│   ├── perfumes/  brands/  alternatives/  reviews/  search/  users/
├── i18n/
│   ├── routing.ts         # Locale config (ar default, en secondary)
│   ├── navigation.ts      # Locale-aware Link/redirect wrappers
│   └── request.ts         # getMessageConfig loader
├── lib/
│   └── utils.ts           # cn() — clsx + tailwind-merge
├── server/
│   ├── db/
│   │   └── client.ts      # Prisma client singleton (@prisma/adapter-pg)
│   ├── actions/           # Server actions (future)
│   ├── repositories/      # Data access: perfumes, brands, alternatives, search
│   └── services/          # Business logic (future)
├── proxy.ts               # next-intl middleware (locale routing)
├── hooks/                 # Custom React hooks (future)
└── types/                 # Shared TypeScript types (future)

messages/
├── ar.json                # Arabic translation catalog
└── en.json                # English translation catalog

prisma/
├── schema.prisma          # Prisma schema: enums, users, brands, perfumes, notes,
│                          #   perfume_notes, alternatives, reviews
├── extensions.sql         # pgvector + pg_trgm extension setup
└── constraints.sql        # CHECK constraints + composite indexes

scripts/
├── ingest/                # FragDB ETL: load, mappers (pure), seed, types
├── run.ts                 # CLI helper wrapper
├── reset-db.ts            # Wipe links/perfumes/notes/brands (cascades)
└── db-health.ts           # Database smoke test

e2e/
└── landing.spec.ts        # Playwright E2E tests

docs/
├── spec/                  # Original product brief
├── superpowers/           # Design specs + implementation plans
├── architecture/          # (future) ADRs, diagrams
└── data-base-plan.md      # Database planning notes
```

## Documentation

- [Architecture](./ARCHITECTURE.md) — System design, data model, tech decisions
- [Contributing](./CONTRIBUTING.md) — Dev setup, code style, testing, PR workflow
- [Changelog](./CHANGELOG.md) — Version history
- [Product Spec](./docs/spec/badilatr.md) — Original product brief

## Database Notes

- **Note layer on the join table:** A note's position (top / heart / base) lives on `perfume_notes`, not `notes` — the same ingredient sits in different layers across perfumes.
- **Vector embeddings:** `perfumes.embedding` is a `vector(1536)` column with an HNSW cosine index. Currently nullable (empty) until the AI Matching subsystem lands.
- **Fuzzy search:** GIN trigram indexes on `perfumes.name` and `brands.name` enable `pg_trgm` similarity matching.
- **Auth-ready:** The `users` table is shaped for [Better Auth](https://better-auth.com) to adopt directly.

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 1 — Foundation | Schema, i18n, design system, landing shell | ✅ Complete |
| 1b — Testing | Vitest + Playwright infrastructure | ✅ Complete |
| 2 — Search | Full-text search, pg_trgm fuzzy, pgvector semantic | 🔜 Next |
| 3 — Matching | AI scent-profile embeddings, similarity ranking | Planned |
| 4 — Detail Pages | Perfume/brand pages, olfactory pyramid, comparison | Planned |
| 5 — Reviews | Ratings, performance metrics, community voting | Planned |
| 6 — Auth + Admin | Better Auth, RBAC, CMS dashboard | Planned |
| 7 — Deployment | Vercel, CI/CD, Lighthouse optimization | Planned |

## License

This project is licensed under the [GNU General Public License v3.0](./LICENSE).
