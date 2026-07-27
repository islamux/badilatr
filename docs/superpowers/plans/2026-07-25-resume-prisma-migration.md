# RESUME — FragDB seed + Drizzle→Prisma migration

_Handoff doc for the next session. Last updated 2026-07-25._

## Goal

Replace the old hardcoded Arabic-house seed with real **FragDB**-scraped data, hosted on **Supabase**. The user then chose to **switch the ORM from Drizzle → Prisma**.

The original seed work (P0–P2) is **done and verified**. The Prisma migration is **~5 % started** (only `@prisma/client` was added as a dependency). **Hard blocker: the Supabase DB password was never provided.**

## DONE & verified (last green gates: `typecheck`, `lint`, `test 54/54`)

- **P0 cleanup** — deleted `scripts/seed-data.ts`, `scripts/seed-data.test.ts`, `scripts/seed.ts`, and the duplicate `scripts/scrape/`. Repointed `db:seed` → `scripts/ingest/seed.ts`; added `db:reset`. Coverage include changed to `scripts/ingest/**` in `vitest.config.ts`, `AGENTS.md`, `ARCHITECTURE.md`.
- **P1 scrape** — ran `perfume_scraper/scrapers/fragdb.py` standalone (no Playwright needed) → `perfume_scraper/output/fragdb_data.json` (10 perfumes + brands/notes/accords/perfumers).
- **P2 ETL** (`scripts/ingest/`, Drizzle-based) — `types.ts`, `mappers.ts` (pure: `mapGender`, `inferConcentration`, `mapFamily`, `mapLayer` middle→heart, `inferBrandType`, `extractDescription`, `slugify`, `decodeEntities`), `mappers.test.ts` (21 tests), `load.ts`, `seed.ts`. Also `scripts/reset-db.ts`.
- **Driver switch** — `src/server/db/client.ts` rewritten from `@neondatabase/serverless` (neon-http) → `drizzle-orm/node-postgres` + `pg` Pool. Installed `pg` + `@types/pg`. Now works with Supabase / Neon / local Postgres via `DATABASE_URL`.

## CURRENT REPO STATE (all UNcommitted; last commit `c6827d7`)

- `package.json` is **mid-migration / inconsistent**:
  - has `@prisma/client ^7.9.0` (added, **currently unused**)
  - still has `drizzle-orm`, `drizzle-kit` (still used by the code)
  - has `pg`, `@types/pg`; still has `@neondatabase/serverless` (unused)
  - **`prisma` devDep was NOT added** (the `pnpm add -D prisma` was aborted).
- `db:generate / db:push / db:migrate / db:studio` still point at `drizzle-kit …`; `db:seed / db:reset / db:health` = `tsx --env-file=.env …`.
- All code is **fully Drizzle** right now and works. No `prisma/` directory exists yet.
- Git status: modified `AGENTS.md`, `ARCHITECTURE.md`, `package.json`, `pnpm-lock.yaml`, `src/server/db/client.ts`, `vitest.config.ts`; deleted old seed + `scripts/scrape/`; untracked `perfume_scraper/`, `scripts/ingest/`, `scripts/reset-db.ts`, `scrpper.md` (last is pre-existing, not ours).
- `.env` still has the **placeholder** `DATABASE_URL=postgres://user:password@host.neon.tech/…`.
- Gates were last confirmed green before `@prisma/client` was added (adding a dep shouldn't change that, but re-verify at resume).

## BLOCKER — Supabase password

Supabase project already created: **ref `peunlmhaipvfdxdtsubc`**, region `aws-0-ap-southeast-2`. Use the **session pooler (port 5432)** for both app and migrations:

```
DATABASE_URL="postgresql://postgres.peunlmhaipvfdxdtsubc:<PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

Need the real `<PASSWORD>` (the one set at project creation). Without it: no `db push`, no seed, no health.

## PRISMA MIGRATION PLAN (resume here; code-only steps need no DB)

1. `pnpm add -D prisma` (aborted today — finish it; match `@prisma/client` 7.9.0).
2. Create `prisma/schema.prisma` (full design below).
3. Replace `src/server/db/client.ts` with the Prisma singleton (below).
4. Rewrite `scripts/ingest/seed.ts`, `scripts/db-health.ts`, `scripts/reset-db.ts` to Prisma Client. **Keep** `mappers.ts`, `mappers.test.ts`, `load.ts`, `types.ts` unchanged (driver-agnostic).
5. `package.json`: remove `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`; change scripts → `prisma generate`, `prisma db push`, `prisma migrate deploy`, `prisma studio`; keep `db:seed / db:reset / db:health` as `tsx --env-file=.env …`.
6. Delete `drizzle.config.ts`, `src/server/db/schema/`, `src/server/db/migrations/`.
7. `pnpm db:generate` (`prisma generate`) → run gates `pnpm typecheck && pnpm lint && pnpm test`.
8. **(needs password)** write `.env` → enable extensions → `prisma db push` → HNSW index + CHECK constraints (raw SQL) → `db:seed` → `db:health`.

### `prisma/schema.prisma`

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum UserRole { admin moderator user }
enum BrandType { arabic designer niche }
enum Gender { male female unisex }
enum Concentration { edt edp parfum extrait }
enum FragranceFamily { woody oriental fresh floral gourmand }
enum NoteLayer { top heart base }
enum Currency { usd sar aed egp }

model User {
  id            String    @id
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false) @map("email_verified")
  image         String?
  role          UserRole  @default(user)
  preferences   Json?
  createdAt     DateTime  @default(now()) @db.Timestamptz(6) @map("created_at")
  updatedAt     DateTime  @default(now()) @db.Timestamptz(6) @map("updated_at")
  reviews       Review[]
  @@index([role])
  @@map("users")
}

model Brand {
  id           Int       @id @default(autoincrement())
  name         String
  slug         String    @unique
  country      String?
  foundedYear  Int?      @map("founded_year")
  logo         String?
  description  String?
  type         BrandType @default(arabic)
  createdAt    DateTime  @default(now()) @db.Timestamptz(6) @map("created_at")
  updatedAt    DateTime  @default(now()) @db.Timestamptz(6) @map("updated_at")
  perfumes     Perfume[]
  @@index([type])
  @@map("brands")
}

model Perfume {
  id               Int              @id @default(autoincrement())
  brandId          Int              @map("brand_id")
  name             String
  slug             String           @unique
  releaseYear      Int?             @map("release_year")
  perfumer         String?
  gender           Gender
  concentration    Concentration
  fragranceFamily  FragranceFamily  @map("fragrance_family")
  description      String?
  image            String?
  embedding        Unsupported("vector(1536)")?
  createdAt        DateTime         @default(now()) @db.Timestamptz(6) @map("created_at")
  updatedAt        DateTime         @default(now()) @db.Timestamptz(6) @map("updated_at")
  brand                    Brand           @relation(fields: [brandId], references: [id], onDelete: Cascade)
  notes                    PerfumeNote[]
  reviews                  Review[]
  alternativesAsOriginal    Alternative[] @relation("original")
  alternativesAsAlternative Alternative[] @relation("alternative")
  @@index([brandId])
  @@index([fragranceFamily])
  @@index([gender])
  @@map("perfumes")
}

model Note {
  id        Int            @id @default(autoincrement())
  name      String
  slug      String         @unique
  createdAt DateTime       @default(now()) @db.Timestamptz(6) @map("created_at")
  perfumes  PerfumeNote[]
  @@map("notes")
}

model PerfumeNote {
  perfumeId Int       @map("perfume_id")
  noteId    Int       @map("note_id")
  layer     NoteLayer
  perfume   Perfume   @relation(fields: [perfumeId], references: [id], onDelete: Cascade)
  note      Note      @relation(fields: [noteId], references: [id], onDelete: Cascade)
  @@id([perfumeId, noteId])
  @@index([noteId])
  @@index([layer])
  @@map("perfume_notes")
}

model Alternative {
  originalId           Int      @map("original_id")
  alternativeId        Int      @map("alternative_id")
  similarityScore      Float    @map("similarity_score")
  priceOriginal        Int?     @map("price_original")
  priceAlternative     Int?     @map("price_alternative")
  currency             Currency @default(usd)
  similarityExplanation String? @map("similarity_explanation")
  advantages           String[]
  disadvantages        String[]
  expertNotes          String?  @map("expert_notes")
  createdAt            DateTime @default(now()) @db.Timestamptz(6) @map("created_at")
  updatedAt            DateTime @default(now()) @db.Timestamptz(6) @map("updated_at")
  original    Perfume @relation("original", fields: [originalId], references: [id], onDelete: Cascade)
  alternative Perfume @relation("alternative", fields: [alternativeId], references: [id], onDelete: Cascade)
  @@id([originalId, alternativeId])
  @@index([alternativeId])
  @@index([similarityScore])
  @@map("alternatives")
}

model Review {
  userId     String   @map("user_id")
  perfumeId  Int      @map("perfume_id")
  rating     Int
  longevity  Int?
  projection Int?
  sillage    Int?
  comment    String?
  verified   Boolean  @default(false)
  createdAt  DateTime @default(now()) @db.Timestamptz(6) @map("created_at")
  updatedAt  DateTime @default(now()) @db.Timestamptz(6) @map("updated_at")
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  perfume Perfume @relation(fields: [perfumeId], references: [id], onDelete: Cascade)
  @@id([userId, perfumeId])
  @@index([perfumeId])
  @@index([rating])
  @@map("reviews")
}
```

### Raw SQL Prisma can't express (run around `prisma db push`)

- **Before** `prisma db push` (the `vector` column type requires the extension):
  `CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- **After** `prisma db push`:
  `CREATE INDEX IF NOT EXISTS perfumes_embedding_hnsw_idx ON "perfumes" USING hnsw ("embedding" vector_cosine_ops);`
  plus CHECK constraints — `reviews.rating` 1–5; `reviews.longevity/projection/sillage` 0–10; `alternatives.similarity_score` 0–100; `alternatives.original_id <> alternative_id`.

### `src/server/db/client.ts` → Prisma singleton

```ts
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  g.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

### Script rewrite notes (Prisma)

- `seed.ts`: same logic as today's Drizzle version — `prisma.brand.createMany({ data, skipDuplicates: true })`, then `findMany` to build slug→id maps, `prisma.perfume.createMany`, then `prisma.perfumeNote.createMany`. End with `await prisma.$disconnect()`.
- `db-health.ts`: `$queryRaw` for the extension check; `prisma.brand.upsert`/`delete` for the write round-trip.
- `reset-db.ts`: `prisma.perfumeNote.deleteMany()` → `prisma.perfume.deleteMany()` → `prisma.note.deleteMany()` → `prisma.brand.deleteMany()` (reviews/alternatives cascade from perfumes).

## Decision fork for the next session

- **Prisma path** (user's stated choice): do the migration plan above first, then connect+seed.
- **Drizzle path** (much less work, ~95 % done): skip the migration; just get the Supabase password → `pnpm db:push` (drizzle-kit) → `pnpm db:seed` → `pnpm db:health`. The current code already works on Drizzle+pg.

Either way the **first need is the Supabase `<PASSWORD>`**.

## Persistence

Nothing is committed — all work is in the working tree. Recommended at resume: a WIP commit to preserve the ETL + driver switch + cleanup, e.g.
`git add -A && git commit -m "wip: FragDB ETL, pg driver, prisma migration started"`.
