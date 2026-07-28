# Rasasi (Salla) Scraper Design

## Purpose
Add a `"salla"` scraper type to `scrape_official.py` for Rasasi's Salla store. Outputs FragDB-shaped JSON for ingestion by `scripts/ingest/seed.ts`.

## Discovery
- Parse `sitemap-2.xml` from the store to get all product URLs
- Pattern: `/ar/{arabic-slug}/p{product-id}`
- ~136 URLs total (incl. non-perfume, which are filtered out)

## Per-Product Scraping
For each product URL, fetch HTML and extract via regex (stdlib-only, no new dependencies):

| Field | Source |
|-------|--------|
| Name | `<title>` tag or JSON-LD `name` |
| Description | Product description div |
| Notes (pyramid) | Arabic patterns: `النوتة العليا :`, `النوتة الوسطى :`, `النوتة القاعدية :` |
| Gender | Subtitle text: رجالي / نسائي / للجنسين |
| Price | JSON-LD `offers.price` |
| Image | First product gallery image |
| SKU | رقم الموديل field |

## Filtering
Skip non-perfume products by Arabic keywords:
- بخور (bakhoor/incense)
- دهن (oud oil)
- مسك (musk)
- معطرات جسم/شعر/جو (body/hair/home sprays)
- مبخرة (incense burner)

## Limit Handling
`--limit` caps total products processed (after filtering).

## Lattafa (Deferred)
Investigated: not Shopify (no `/products.json`, no `/collections/all`). Custom storefront — needs separate research phase. Will build after Rasasi scraper is productionized.

## Output Schema
Same as Shopify scraper — `perfume_scraper/output/rasasi_scraped.json` with `perfumes[]` array, each entry matching the shape expected by `seed.ts`.

## Testing
- Run: `python3 scrape_official.py --brand Rasasi --limit 5`
- Check note pyramid extraction from 3-5 product pages
- Verify output JSON parses correctly by seed mappers

## Risks
- Salla may change HTML structure (regex is fragile but acceptable for throwaway data pipeline)
- Rate limiting from Salla CDN — adds 2s delay between requests
- Notes in Arabic letters may not match English DB note names (seed mapper handles aliasing)

## Next After Rasasi
1. Investigate Lattafa platform (probably Magento or custom PHP)
2. Build WooCommerce/Magento scraper if applicable
3. Seed both brands, validate alternatives engine with richer data
