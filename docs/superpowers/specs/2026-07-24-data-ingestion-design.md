# Data Ingestion Pipeline Design

**Date:** 2026-07-24
**Status:** Approved
**Scope:** Python scraping pipeline for Arabic perfume houses — 7 sites, starting with 10 perfumes.

## Sites

| Site | Platform | Notes Data | Method |
|---|---|---|---|
| Afnan | Shopify | Explicit Top/Middle/Base block | `/products.json` + JSON-LD |
| Rasasi | Salla (SA) | Arabic note labels | Sitemap → PDP JSON-LD |
| Armaf | Shopify | Collection taxonomy | `/products.json` + JSON-LD |
| Ibraq | Salla (SA) | Same template as Rasasi | Sitemap → PDP JSON-LD |
| Lattafa | WooCommerce | Unconfirmed | `sitemap_index.xml` |
| 3itr | WordPress | Editorial text only | RSS (enrichment) |
| ~~Fragrantica Arabia~~ | Cloudflare | Blocked | Skip |

## Architecture

Python scrapers → JSON output → TypeScript import → Drizzle → PostgreSQL

## Phase 1: 10 perfumes (5 Afnan + 5 Rasasi)
