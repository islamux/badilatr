# RESUME — Arabic Data Pipeline (Phase 1)

_Handoff doc for the next session. Last updated: 2026-07-28._
**Branch:** `feat/arabic-data-pipeline` (NOT yet committed — WIP, see below)

## Goal

Build a **repeatable, resumable pipeline** to scrape Arabic perfume houses from their **official e-commerce stores** (free, legal, no anti-bot) and seed them alongside the 10 designer originals — so the product can show designer→Arabic alternatives.

## What's DONE (verified)

- **De-risked:** Afnan (`https://afnan.com`) and Armaf (`https://www.armaf.ae`) `/products.json` endpoints return rich data (Shopify). Rasasi Salla store (`store.rasasi.com.sa`) reachable. Afnan PDPs contain full note pyramids in `body_html`.
- **Built the scraper:** `perfume_scraper/scrape_official.py` — clean, **stdlib-only** (no httpx/playwright dep), config-driven via `perfume_scraper/brands.json`. Parses Top/Middle/Base notes from `body_html`. Emits **FragDB-shaped JSON** (so `seed.ts` ingests it unchanged — no adapter needed).
- **Generalized seed:** `scripts/ingest/seed.ts` now accepts a path arg: `pnpm db:seed <path-to-json>`.
- **Scraped Afnan:** `perfume_scraper/output/afnan_scraped.json` — **80 perfumes, all 80 with note pyramids** (correctly parsed after a regex fix).
- **Fixed a note-parsing bug:** initial regex over-captured across sections; fixed with lookahead `(?=\s*(?:middle|heart|base)\s*notes?:|$)`. Verified: Malak → top: Marshmallow/Lemon/Apple/White Floral, middle: Musk/Coconut/Orange Blossom, base: Amber/Vanilla/Sugar. ✓

## CURRENT STATE — resume here

### DB state (LIVE)
| brand | type | perfumes |
|---|---|---|
| Afnan | arabic | **0** ← brand exists, perfumes were cleaned (buggy seed removed); **needs re-seed** |
| 7 designer brands | designer | 10 |

### Git state (UNcommitted WIP on `feat/arabic-data-pipeline`)
- Modified: `scripts/ingest/seed.ts` (path arg)
- New (untracked): `perfume_scraper/scrape_official.py`, `perfume_scraper/brands.json`
- `perfume_scraper/output/afnan_scraped.json` is gitignored (regenerable)
- `scrpper.md` is pre-existing, NOT ours — do not commit

## ▶️ RESUME COMMANDS (do these first)

```bash
git checkout feat/arabic-data-pipeline

# 1. Re-seed Afnan (scraped file is ready, regex fixed)
pnpm db:seed perfume_scraper/output/afnan_scraped.json
# Expected: "✓ Seeded from FragDB: 1 brands, ~299 notes, 80 perfumes, ~493 note links."

# 2. Verify
psql "$DATABASE_URL" -c "SELECT b.name, b.type, count(p.id) FROM brands b LEFT JOIN perfumes p ON p.brand_id=b.id GROUP BY b.name,b.type ORDER BY b.type;"

# 3. Scrape + seed Armaf (Shopify, same as Afnan)
python3 perfume_scraper/scrape_official.py --brand Armaf --limit 250
pnpm db:seed perfume_scraper/output/armaf_scraped.json
```

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
