#!/usr/bin/env python3
"""Main scraper orchestrator for Arabic perfume houses."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from models import ScrapedBrand
from sites.shopify import ShopifyScraper
from sites.salla import SallaScraper

OUTPUT_DIR = Path(__file__).parent / "output"

SITES: list[dict] = [
    {
        "name": "Afnan",
        "type": "shopify",
        "url": "https://afnan.com",
        "country": "United Arab Emirates",
        "delay": 2.5,
    },
    {
        "name": "Rasasi",
        "type": "salla",
        "url": "https://store.rasasi.com.sa",
        "country": "Saudi Arabia",
        "delay": 3.0,
    },
    {
        "name": "Armaf",
        "type": "shopify",
        "url": "https://www.armaf.ae",
        "country": "United Arab Emirates",
        "delay": 2.5,
    },
    {
        "name": "Ibraq",
        "type": "salla",
        "url": "https://saudi.ibraqperfumes.com",
        "country": "Saudi Arabia",
        "delay": 3.0,
    },
]


def run_scraper(site: dict, max_products: int = 5) -> ScrapedBrand:
    kwargs = {
        "base_url": site["url"],
        "brand_name": site["name"],
        "country": site.get("country"),
        "delay": site.get("delay", 3.0),
        "max_products": max_products,
    }

    scraper_type = site["type"]
    if scraper_type == "shopify":
        with ShopifyScraper(**kwargs) as s:
            return s.scrape()
    elif scraper_type == "salla":
        with SallaScraper(**kwargs) as s:
            return s.scrape()
    else:
        print(f"  ✗ Unknown scraper type: {scraper_type}")
        return ScrapedBrand(
            name=site["name"],
            slug=site["name"].lower().replace(" ", "-"),
            website=site["url"],
        )


def save_json(brand: ScrapedBrand, filename: str):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(brand.model_dump(), f, ensure_ascii=False, indent=2)
    print(f"  💾 Saved {path}")


def main():
    max_products = 5
    if len(sys.argv) > 1:
        max_products = int(sys.argv[1])

    site_filter = sys.argv[2] if len(sys.argv) > 2 else None

    sites = SITES
    if site_filter:
        sites = [s for s in SITES if s["name"].lower() == site_filter.lower()]

    print(f"\n{'='*60}")
    print(f"  Badil Atr — Perfume Data Scraper")
    print(f"  Sites: {', '.join(s['name'] for s in sites)}")
    print(f"  Max products per site: {max_products}")
    print(f"{'='*60}\n")

    all_brands: list[ScrapedBrand] = []

    for site in sites:
        print(f"\n--- {site['name']} ({site['type']}) ---")
        brand = run_scraper(site, max_products=max_products)
        all_brands.append(brand)
        save_json(brand, f"{brand.slug}.json")

    merged = {
        "scraped_at": __import__("datetime").datetime.now().isoformat(),
        "brands": [b.model_dump() for b in all_brands],
        "total_perfumes": sum(len(b.perfumes) for b in all_brands),
    }
    merged_path = OUTPUT_DIR / "merged.json"
    with open(merged_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    total_notes = sum(
        len(p.notes) for b in all_brands for p in b.perfumes
    )
    print(f"\n{'='*60}")
    print(f"  ✓ Done! {len(all_brands)} brands, {merged['total_perfumes']} perfumes, {total_notes} notes")
    print(f"  Output: {merged_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
