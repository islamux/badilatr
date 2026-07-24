# Badil Atr (بديل عطر)

A premium perfume discovery platform — the "IMDb + recommendation engine for fragrances." Arabic-first, with transparent similarity scoring between luxury fragrances and their alternatives.

> This repository currently contains the **Foundation** layer: architecture, full DB schema, i18n (AR/EN, RTL/LTR), the luxury design system, and seed data. Feature pages, search, and the matching engine arrive in subsequent milestones.

## Tech stack

- **Framework:** Next.js 16 (App Router, RSC, Turbopack), TypeScript (strict)
- **Styling:** Tailwind CSS v4, shadcn/ui primitives, Radix, Lucide
- **i18n:** next-intl (locale routing, RTL/LTR, localized metadata)
- **Theming:** next-themes (dark/light)
- **Database:** PostgreSQL (Neon) + `pgvector` + `pg_trgm`
- **ORM:** Drizzle ORM (typed schema-as-code migrations)

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set `DATABASE_URL` to your [Neon](https://neon.tech) connection string (pooled, with `?sslmode=require`). Neon provides `pgvector` and `pg_trgm` out of the box.

### 3. Apply the database schema

```bash
pnpm db:push        # push schema to Neon (dev)
# or
pnpm db:migrate     # run generated SQL migrations
```

### 4. Verify + seed

```bash
pnpm db:health       # smoke test: extensions + write round-trip
pnpm db:seed         # curated Arabic perfume houses + perfumes + notes
```

### 5. Run the dev server

```bash
pnpm dev
```

Open <http://localhost:3000/ar> (Arabic, default) or <http://localhost:3000/en>.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:push` | Push schema directly to the DB (dev) |
| `pnpm db:migrate` | Apply generated migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:health` | DB smoke test |
| `pnpm db:seed` | Seed Arabic-house data |

## Project structure

```
src/
├── app/[locale]/        # locale-segmented routes (root layout + landing)
├── components/          # shared UI (header, footer, toggles) + ui/ primitives
├── features/            # feature modules (perfumes, brands, …) — empty seams
├── i18n/                # next-intl routing, navigation, request config
├── server/db/           # Drizzle schema, client, migrations
│   └── schema/          # enums, users, brands, perfumes, notes, alternatives, reviews
├── lib/                 # cn() + shared utils
├── hooks/ types/
messages/{ar,en}.json    # translation catalogs
scripts/                 # seed + db-health
docs/spec/               # original product brief
```

## Database notes

- **Note layer on the join table:** a note's position (top / heart / base) lives on `perfume_notes`, not `notes`, since the same ingredient sits in different layers across perfumes.
- **`perfumes.embedding`** is a `vector(1536)` column (HNSW cosine index) — mocked empty until the Matching subsystem lands.
- The `users` table is shaped for **Better Auth** to adopt directly in the Auth subsystem.
