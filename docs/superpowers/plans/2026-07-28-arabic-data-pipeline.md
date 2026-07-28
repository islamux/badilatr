# RESUME — Arabic Data Pipeline (Phase 1)

_Handoff doc. Last updated: 2026-07-28. **Phase 1 COMPLETE (Afnan + Armaf).**_
**Branch:** `feat/arabic-data-pipeline`

## Goal

Build a **repeatable, resumable pipeline** to scrape Arabic perfume houses from their **official e-commerce stores** (free, legal, no anti-bot) and seed them alongside the designer originals.

## ✅ DONE — Phase 1 (Afnan + Armaf)

- **Scraper:** `perfume_scraper/scrape_official.py` — stdlib-only, config-driven (`perfume_scraper/brands.json`). Parses Top/Middle/Base notes from Shopify `body_html`. Emits FragDB-shaped JSON.
- **Seed generalized:** `pnpm db:seed <path>` accepts any FragDB-shaped JSON.
- **Afnan:** scraped (80 perfumes, 80 with pyramids) + seeded ✓
- **Armaf:** scraped (229 perfumes, 166 with pyramids) + seeded (227 after slug dedup) ✓
- **Total catalog:** 317 perfumes (10 designer + 307 Arabic), 743 notes, ~2300 note links.
- Gates: typecheck ✓ · lint ✓ · 65/65 tests ✓. Search finds Arabic perfumes ✓.

## Then: the rest of Phase 1

- **Rasasi (Salla):** the `salla` scraper type is NOT yet implemented in `scrape_official.py` (currently prints "not yet implemented — skipping"). Salla stores use JSON-LD on product pages + a sitemap. Need to add a `scrape_salla()` function. Check `store.rasasi.com.sa` structure first.
- **Lattafa (WooCommerce):** not in `brands.json` yet. WooCommerce stores expose `/wp-json/wc/store/products`. Add `{name:"Lattafa", type:"woocommerce", url:"https://lattafa.com", country:"AE"}` + implement `scrape_woocommerce()`.
- After all brands seeded: run gates (`pnpm typecheck && pnpm lint && pnpm test`), then **commit + PR + merge**.

## How to ADD a brand (the repeatable recipe)

1. Add a line to `perfume_scraper/brands.json`: `{"name":"X","type":"shopify","url":"https://...","country":"AE"}`
2. `python3 perfume_scraper/scrape_official.py --brand X`
3. `pnpm db:seed perfume_scraper/output/x_scraped.json`
4. (If a new `type`, implement `scrape_<type>()` in `scrape_official.py`.)

Seed is idempotent (slug-based `skipDuplicates`), so re-running never duplicates. To **re-scrape** a brand cleanly, delete its data first:
```sql
DELETE FROM perfume_notes WHERE perfume_id IN (SELECT id FROM perfumes WHERE brand_id IN (SELECT id FROM brands WHERE name='X'));
DELETE FROM perfumes WHERE brand_id IN (SELECT id FROM brands WHERE name='X');
DELETE FROM brands WHERE name='X';
DELETE FROM notes WHERE id NOT IN (SELECT DISTINCT note_id FROM perfume_notes);
```

## Phase 2 & 3 (separate plans, after Phase 1 lands)

- **Phase 2 — Curated dupe pairings:** a typed dataset of ~15-20 designer↔Arabic `alternatives` rows (score, prices, advantages, "why similar") from public fragrance knowledge. Seed script for the `alternatives` table.
- **Phase 3 — Alternatives UI + scorer:** `getAlternatives(perfumeId)` + comparison section on the perfume detail page (similarity %, price diff, reasoning). A note-overlap scorer (`src/lib/similarity.ts`, pure + tested).

## Known issues / notes

- `perfume_scraper/output/` is gitignored — scraped JSON regenerates from the live store.
- The scraper detects gender from title/tags heuristically; family defaults to `'oriental'` (no accords available — `mapFamily` default). Both acceptable for now; the matching engine uses note pyramids primarily.
- Images come from `cdn.shopify.com` (already in `next.config.ts` remotePatterns ✓).
