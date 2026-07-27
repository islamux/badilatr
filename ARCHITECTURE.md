# Architecture

> Technical deep-dive into the Badil Atr platform — system design, data model, and engineering decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│              RTL (ar) / LTR (en) · Dark/Light            │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              Next.js 16 (Vercel / Node.js)               │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────┐ │
│  │ App Router│  │  next-intl  │  │   Server Components │ │
│  │ [locale]/ │  │  middleware │  │   (RSC + streaming) │ │
│  └──────────┘  └─────────────┘  └─────────┬──────────┘ │
│  ┌──────────────────────────────────────┐ │            │
│  │ Drizzle ORM (typed queries)          │◄┘            │
│  └──────────────────┬───────────────────┘              │
└─────────────────────┼───────────────────────────────────┘
                      │ pooled connection (WebSocket / HTTP)
┌─────────────────────▼───────────────────────────────────┐
│              Neon PostgreSQL (Serverless)                │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │pgvector │  │ pg_trgm  │  │ Tables (7) + Indexes   │ │
│  │(HNSW)   │  │ (GIN)    │  │                        │ │
│  └─────────┘  └──────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack Rationale

### Next.js 16 (App Router)
Chosen for React Server Components (zero client JS for static content), streaming SSR, file-based routing, and built-in i18n segment support. The App Router's `[locale]` segment pairs naturally with next-intl.

### TypeScript (strict mode)
Strict null checks and no implicit `any` catch bugs at compile time. The entire stack — schema, queries, components, API routes — is typed end-to-end.

### Drizzle ORM (not Prisma)
Drizzle was chosen over Prisma for:
- **pgvector first-class support** — native `vector(1536)` column type
- **SQL-like query builder** — full control over hybrid search (full-text + trigram + vector)
- **Schema-as-code migrations** — generated SQL is auditable and augmented with custom indexes
- **No runtime overhead** — thin layer over SQL, no query engine binary

### Neon (Serverless PostgreSQL)
- HTTP/WebSocket driver (no TCP connection pooling needed)
- DB branching for preview environments
- pgvector and pg_trgm built-in (no manual extension installation)
- Generous free tier for development

### next-intl (not next-i18next or react-intl)
- Native App Router support with `[locale]` segments
- Server Component integration (`getTranslations`, `setRequestLocale`)
- Type-safe message keys
- Built-in locale detection and routing middleware

### Tailwind CSS v4 + shadcn/ui
- v4: CSS-first configuration, no `tailwind.config.js` needed
- shadcn/ui: owned components (not a dependency), Radix primitives, fully customizable
- Design tokens as CSS custom properties → runtime theme switching

## Data Model

### Entity Relationship

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  users   │     │  brands  │     │   perfumes   │
│──────────│     │──────────│     │──────────────│
│ id (PK)  │     │ id (PK)  │◄────│ brandId (FK) │
│ email    │     │ name     │     │ id (PK)      │
│ role     │     │ slug     │     │ name         │
│ ...      │     │ country  │     │ slug         │
└────┬─────┘     │ type     │     │ gender       │
     │           └──────────┘     │ concentration│
     │                            │ family       │
     │           ┌──────────┐     │ embedding    │
     │           │  notes   │     │ (vector 1536)│
     │           │──────────│     └──────┬───────┘
     │           │ id (PK)  │            │
     │           │ name     │     ┌──────▼───────┐
     │           │ slug     │     │ perfume_notes│
     │           └────┬─────┘     │ (join table) │
     │                │           │──────────────│
     │                └──────────►│ perfumeId(FK)│
     │                            │ noteId (FK)  │
     │                            │ layer        │
     │                            └──────────────┘
     │
     │           ┌──────────────────┐
     │           │    reviews       │
     │           │──────────────────│
     ├──────────►│ userId (FK)      │
     │           │ perfumeId (FK)   │
     │           │ rating (1-5)     │
     │           │ longevity (0-10) │
     │           │ projection(0-10) │
     │           │ sillage (0-10)   │
     │           └──────────────────┘
     │
     │           ┌─────────────────────┐
     │           │   alternatives      │
     │           │─────────────────────│
     │           │ sourcePerfumeId(FK) │──┐ (composite PK)
     │           │ targetPerfumeId(FK) │──┘
     │           │ similarityScore(0-100)│
     │           │ advantages[]       │
     │           │ disadvantages[]    │
     │           └─────────────────────┘
```

### Tables (7)

| Table | Purpose | Key Constraints |
|---|---|---|
| `users` | Auth-ready user accounts | Unique email, role enum (admin/moderator/user) |
| `brands` | Perfume houses | Unique slug, type enum (arabic/designer/niche) |
| `perfumes` | Individual fragrances | Unique slug, gender/concentration/family enums, `embedding vector(1536)` nullable |
| `notes` | Fragrance ingredients (oud, rose, saffron…) | Unique slug |
| `perfume_notes` | Join table: which notes are in which perfume | `layer` enum (top/heart/base) **on the join** — not on `notes` |
| `alternatives` | Directed similarity between two perfumes | Composite PK (source + target), `similarity_score` CHECK 0–100, CHECK no self-reference |
| `reviews` | User ratings + performance metrics | Rating CHECK 1–5, longevity/projection/sillage CHECK 0–10 |

### Indexes

| Index | Type | Column | Purpose |
|---|---|---|---|
| `perfumes.embedding` | HNSW (cosine) | `vector(1536)` | Semantic similarity search (fast nearest-neighbor) |
| `perfumes.name` | GIN trigram | `text` | Fuzzy name matching (`pg_trgm` similarity) |
| `brands.name` | GIN trigram | `text` | Fuzzy brand name matching |

### Design Decision: Note Layer on the Join Table

A note's olfactory layer (top / heart / base) is **perfume-dependent**. Oud can be a base note in one fragrance and a top note in another. Placing `layer` on the `perfume_notes` join table (rather than on `notes`) correctly models this many-to-many relationship.

## Internationalization (i18n)

### Architecture

```
Request → proxy.ts (middleware) → locale extraction → [locale] segment
                                                              │
                              ┌───────────────────────────────┘
                              ▼
                   next-intl request config
                   ┌──────────────────────┐
                   │ getMessages(locale)  │ → messages/{ar,en}.json
                   │ setRequestLocale()   │ → enables static rendering
                   └──────────────────────┘
                              │
                              ▼
                   <NextIntlClientProvider>
                   ┌──────────────────────┐
                   │ useTranslations()    │ → client components
                   │ useLocale()          │
                   │ useFormatter()       │
                   └──────────────────────┘
```

### Key Decisions

- **Arabic is the default locale** (`/ar`), English is secondary (`/en`)
- **`localeDetection: false`** — deterministic locale resolution (no browser sniffing)
- **RTL/LTR via `<html dir>`** — set in the root layout, not per-component
- **Font switching** — Cairo for Arabic, Inter for English, applied via `font-arabic` / `font-sans` classes
- **Static prerendering** — both locales are statically generated at build time

## Design System

### Color Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--obsidian` | — | `oklch(0.15 0.01 280)` | Primary dark background |
| `--gold` | `oklch(0.75 0.15 85)` | `oklch(0.80 0.13 85)` | Brand accent, badges, CTAs |
| `--champagne` | `oklch(0.90 0.03 80)` | `oklch(0.85 0.04 80)` | Subtle highlights |
| `--ivory` | `oklch(0.98 0.005 90)` | — | Light background |
| `--slate` | — | `oklch(0.30 0.02 280)` | Muted text, borders |

### Theming

- CSS custom properties defined in `globals.css` under `:root` (light) and `.dark` (dark)
- `next-themes` toggles the `.dark` class on `<html>`
- `@custom-variant dark (&:is(.dark *))` enables Tailwind's `dark:` variant
- `@theme inline` maps CSS vars to Tailwind's color system for utility class generation

## Testing Strategy

### Layers

```
┌─────────────────────────────────┐
│         E2E (Playwright)        │  ← Browser flows: rendering, navigation, locale
│    5 tests · ~9s · Chromium     │
├─────────────────────────────────┤
│    Component (RTL + Vitest)     │  ← UI behavior: rendering, events, variants
│   26 tests · <1s · happy-dom    │
├─────────────────────────────────┤
│      Unit / Data (Vitest)       │  ← Pure logic: cn(), seed data integrity
│   20 tests · <1s · node         │
└─────────────────────────────────┘
```

### Coverage

- **Scope:** `src/lib/**`, `src/components/ui/**`, `scripts/ingest/**`
- **Threshold:** 70% minimum (statements, branches, functions, lines)
- **Current:** 100%
- **Excluded:** Pages (tested via E2E), DB client (needs live DB), config files

## Directory Conventions

- **`src/app/`** — Next.js App Router pages and layouts only
- **`src/components/`** — Shared UI components (presentational)
- **`src/components/ui/`** — shadcn/ui primitives (owned, not a dependency)
- **`src/features/`** — Feature modules (each feature gets its own directory)
- **`src/server/`** — Server-only code (DB, actions, repositories, services)
- **`src/i18n/`** — next-intl configuration (never import from client components directly)
- **`src/lib/`** — Pure utility functions (no side effects)
- **`scripts/`** — CLI scripts (seeding, health checks)
- **`e2e/`** — Playwright E2E test specs
- **`docs/`** — Documentation, specs, planning artifacts

## Roadmap

See [README.md → Roadmap](./README.md#roadmap) for the phase-by-phase breakdown.
