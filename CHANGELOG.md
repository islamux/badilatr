# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-24

### Added

- **Foundation layer:** Next.js 16 + TypeScript (strict) project scaffold with Tailwind CSS v4, ESLint 9, Prettier
- **Luxury design system:** Obsidian/Gold/Champagne/Ivory/Slate color palette as CSS custom properties with dark/light mode support via next-themes
- **Typography:** Inter (Latin/LTR) + Cairo (Arabic/RTL) fonts via next/font/google
- **shadcn/ui primitives:** Button, Card, Badge, Input, Skeleton, Separator (new-york style)
- **Internationalization:** next-intl with `[locale]` routing, Arabic default (RTL) + English (LTR), locale-aware navigation wrappers, static prerendering for both locales
- **Database schema:** 7-table PostgreSQL model (users, brands, perfumes, notes, perfume_notes, alternatives, reviews) via Drizzle ORM
  - pgvector `embedding vector(1536)` column on perfumes with HNSW cosine index
  - pg_trgm GIN indexes on perfume and brand names for fuzzy search
  - Check constraints on ratings (1–5), performance metrics (0–10), similarity scores (0–100)
  - Note layer (top/heart/base) on the `perfume_notes` join table
  - Composite primary key on alternatives with self-reference prevention
- **Database migrations:** Generated SQL with augmented extensions (`vector`, `pg_trgm`) and custom indexes
- **Seed data:** 8 Arabic perfume houses, 24 fragrance notes, 8 perfumes with representative olfactory pyramids
- **Landing page:** Hero section with gold gradient, search bar, 4 "coming soon" shelf sections with skeleton cards
- **Site chrome:** Header (nav + locale switcher + theme toggle) and footer
- **Testing infrastructure:** Vitest 4 + React Testing Library + jest-dom matchers, Playwright with Chromium
  - 46 unit/integration tests across 4 test files (100% coverage)
  - 5 Playwright E2E tests (locale redirect, RTL/LTR, hero rendering, locale switch)
  - 70% coverage thresholds (currently at 100%)
- **Professional documentation:** README, ARCHITECTURE, CONTRIBUTING, CHANGELOG, GPL-3.0 LICENSE

### Fixed

- **RSC crash:** `<Button asChild><Link/>` in site header crashed under React 19 Server Components (Radix Slot received lazy RSC reference). Fixed by extracting `buttonVariants` to a server-safe module and applying classes directly to `<Link>`.
- **Locale redirect:** `/` was redirecting to `/en` (browser language detection) instead of `/ar` (default locale). Fixed by setting `localeDetection: false` in next-intl routing config.

### Changed

- `package.json` enriched with `description`, `license`, `repository`, `homepage`, and `author` metadata fields
- Root-level `data-base-plan.md` moved to `docs/data-base-plan.md` for cleaner project root

[0.1.0]: https://github.com/islamux/badilatr/releases/tag/v0.1.0
