"""
Perfume Scraper - Main Orchestrator
====================================
Runs scrapers sequentially and merges results into JSON files.

Primary sources:
  - FragDB (fast, reliable, rich data from Fragrantica via structured CSV)
  - Fragrantica (Playwright-based, rate-limited but live data)
  - Basenotes (supplementary reviews)
  - Notino (pricing data)

Usage:
    python main.py --all            # Run all scrapers
    python main.py --fragdb         # Run FragDB (recommended - fastest)
    python main.py --fragrantica    # Run Fragrantica only
    python main.py --basenotes      # Run Basenotes only
    python main.py --notino         # Run Notino only
    python main.py --merge          # Merge existing JSON files
    python main.py --fragdb --fragrantica  # Run both data sources
"""

import os
import sys
import json
import argparse
from datetime import datetime, timezone

from scrapers.fragdb import scrape_fragdb
from scrapers.fragrantica import FragranticaScraper
from scrapers.basenotes import BasenotesScraper
from scrapers.notino import NotinoScraper

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")


def merge_all_data():
    """Merge all scraped JSON files into a single combined file."""
    print(f"\n{'='*60}")
    print(f"MERGING ALL DATA")
    print(f"{'='*60}")

    merged = {
        "merged_at": datetime.now(timezone.utc).isoformat(),
        "sources": {},
        "total_perfumes": 0,
        "total_products": 0,
        "perfumes": [],
        "products": [],
    }

    json_files = {
        "fragdb": os.path.join(OUTPUT_DIR, "fragdb_data.json"),
        "fragrantica": os.path.join(OUTPUT_DIR, "fragrantica_data.json"),
        "basenotes": os.path.join(OUTPUT_DIR, "basenotes_data.json"),
        "notino": os.path.join(OUTPUT_DIR, "notino_prices.json"),
    }

    for source, filepath in json_files.items():
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            merged["sources"][source] = {
                "file": filepath,
                "records": data.get("total_count", 0),
                "scraped_at": data.get("scraped_at", "unknown"),
                "data_version": data.get("data_version", None),
                "source_url": data.get("source_url", None),
            }

            # Categorize data
            if source in ["fragdb", "fragrantica", "basenotes"]:
                perfumes = data.get("perfumes", [])
                merged["perfumes"].extend(perfumes)
                merged["total_perfumes"] += len(perfumes)
            else:
                products = data.get("products", [])
                merged["products"].extend(products)
                merged["total_products"] += len(products)

            print(f"  ✓ Loaded {source}: {data.get('total_count', 0)} records")
        else:
            print(f"  ✗ File not found: {filepath}")

    # Deduplicate perfumes by name+brand
    seen = set()
    unique_perfumes = []
    for p in merged["perfumes"]:
        key = f"{p.get('brand', '')}|{p.get('name', '')}"
        if key not in seen:
            seen.add(key)
            unique_perfumes.append(p)
    merged["perfumes"] = unique_perfumes
    merged["unique_perfumes"] = len(unique_perfumes)

    # Save merged file
    merged_file = os.path.join(OUTPUT_DIR, "merged_data.json")
    with open(merged_file, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"\n  [SAVE] Merged data saved to: {merged_file}")
    print(f"  [SAVE] Total perfume records: {merged['total_perfumes']}")
    print(f"  [SAVE] Unique perfumes: {merged['unique_perfumes']}")
    print(f"  [SAVE] Total products: {merged['total_products']}")
    print(f"{'='*60}")

    return merged_file


def run_fragdb():
    """Run FragDB scraper (recommended - fast, reliable, rich data)."""
    perfumes, output_file = scrape_fragdb()
    return perfumes, []


def run_fragrantica(limit=None):
    """Run Fragrantica scraper (Playwright-based, rate-limited)."""
    scraper = FragranticaScraper(
        output_dir=OUTPUT_DIR,
        max_perfumes=limit or 50,
    )
    perfumes, failed = scraper.scrape_all_brands()
    return perfumes, failed


def run_basenotes(limit=None):
    """Run Basenotes scraper (supplementary reviews)."""
    scraper = BasenotesScraper(
        output_dir=OUTPUT_DIR,
        max_perfumes=limit or 30,
    )
    perfumes, failed = scraper.scrape_all_brands()
    return perfumes, failed


def run_notino(limit=None):
    """Run Notino scraper (pricing data)."""
    scraper = NotinoScraper(
        output_dir=OUTPUT_DIR,
        max_products=limit or 30,
    )
    products, failed = scraper.scrape_all_products()
    return products, failed


def main():
    parser = argparse.ArgumentParser(
        description="Perfume Data Scraper - Collect perfume data from multiple sources"
    )
    parser.add_argument("--all", action="store_true", help="Run all scrapers")
    parser.add_argument("--fragdb", action="store_true", help="Run FragDB scraper (recommended)")
    parser.add_argument("--fragrantica", action="store_true", help="Run Fragrantica scraper")
    parser.add_argument("--basenotes", action="store_true", help="Run Basenotes scraper")
    parser.add_argument("--notino", action="store_true", help="Run Notino scraper")
    parser.add_argument("--merge", action="store_true", help="Merge existing JSON files")
    parser.add_argument("--limit", type=int, default=None, help="Max items per scraper")

    args = parser.parse_args()

    # If no args, show help
    if not any([args.all, args.fragdb, args.fragrantica, args.basenotes, args.notino, args.merge]):
        parser.print_help()
        print("\nRecommended: python main.py --fragdb --limit 100")
        print("All sources: python main.py --all --limit 50")
        sys.exit(0)

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    results = {}

    if args.merge:
        merge_all_data()
        return

    if args.all or args.fragdb:
        print("\n" + "=" * 60)
        print("RUNNING: FRAGDB SCRAPER (Primary)")
        print("=" * 60)
        perfumes, failed = run_fragdb()
        results["fragdb"] = {"perfumes": len(perfumes), "failed": len(failed)}

    if args.all or args.fragrantica:
        print("\n" + "=" * 60)
        print("RUNNING: FRAGRANTICA SCRAPER (Live)")
        print("=" * 60)
        perfumes, failed = run_fragrantica(limit=args.limit)
        results["fragrantica"] = {"perfumes": len(perfumes), "failed": len(failed)}

    if args.all or args.basenotes:
        print("\n" + "=" * 60)
        print("RUNNING: BASENOTES SCRAPER")
        print("=" * 60)
        perfumes, failed = run_basenotes(limit=args.limit)
        results["basenotes"] = {"perfumes": len(perfumes), "failed": len(failed)}

    if args.all or args.notino:
        print("\n" + "=" * 60)
        print("RUNNING: NOTINO SCRAPER")
        print("=" * 60)
        products, failed = run_notino(limit=args.limit)
        results["notino"] = {"products": len(products), "failed": len(failed)}

    # Merge all results
    print("\n" + "=" * 60)
    print("MERGING RESULTS")
    print("=" * 60)
    merge_file = merge_all_data()

    # Summary
    print(f"\n{'='*60}")
    print(f"FINAL SUMMARY")
    print(f"{'='*60}")
    for scraper_name, data in results.items():
        print(f"  {scraper_name}: {data}")
    print(f"\n  Merged file: {merge_file}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
