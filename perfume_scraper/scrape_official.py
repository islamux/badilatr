#!/usr/bin/env python3
"""Scrape Arabic perfume houses from their official e-commerce stores.

Emits JSON in the FragDB shape so scripts/ingest/seed.ts ingests it unchanged.

Usage:
  python3 perfume_scraper/scrape_official.py                 # all brands in brands.json
  python3 perfume_scraper/scrape_official.py --brand Afnan   # one brand
  python3 perfume_scraper/scrape_official.py --limit 20      # cap products per brand

Output: perfume_scraper/output/{brand_slug}_scraped.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "output"
BRANDS_FILE = Path(__file__).parent / "brands.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "application/json,text/html;q=0.9",
    "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
}

SET_KEYWORDS = re.compile(r"\b(kit|gift\s*set|discovery|bundle|\bset\b)\b", re.I)

NOTE_PATTERNS = [
    (re.compile(r"top\s*notes?\s*:\s*(.*?)(?=\s*(?:middle|heart|base)\s*notes?\s*:|$)", re.I | re.DOTALL), "top"),
    (re.compile(r"(?:middle|heart)\s*notes?\s*:\s*(.*?)(?=\s*base\s*notes?\s*:|$)", re.I | re.DOTALL), "middle"),
    (re.compile(r"base\s*notes?\s*:\s*(.*?)$", re.I | re.DOTALL), "base"),
]

GENDER_KEYWORDS = {
    "female": re.compile(r"\b(women|woman|female|ladies|pour\s*femme|for\s*her)\b", re.I),
    "male": re.compile(r"\b(men|man|male|gentlemen|pour\s*homme|for\s*him)\b", re.I),
}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower().strip()).strip("-")


def fetch(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    encoded_path = urllib.parse.quote(parsed.path, safe='/:@')
    encoded_url = urllib.parse.urlunparse((
        parsed.scheme, parsed.netloc, encoded_path,
        parsed.params, parsed.query, parsed.fragment,
    ))
    req = urllib.request.Request(encoded_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def fetch_json(url: str) -> dict:
    return json.loads(fetch(url))


def strip_html(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def detect_gender(text: str) -> str:
    if GENDER_KEYWORDS["female"].search(text) and not GENDER_KEYWORDS["male"].search(text):
        return "female"
    if GENDER_KEYWORDS["male"].search(text) and not GENDER_KEYWORDS["female"].search(text):
        return "male"
    return "unisex"


def parse_notes(text: str) -> dict:
    notes: dict[str, list[dict]] = {"top": [], "middle": [], "base": []}
    for pattern, layer in NOTE_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue
        for name in re.split(r"[,;]", match.group(1)):
            name = name.strip()
            if name and len(name) < 50:
                notes[layer].append({"id": "", "name": name})
    return notes


def fetch_sitemap_products(base_url: str) -> list[str]:
    sitemap = fetch(f"{base_url.rstrip('/')}/ar/sitemap-2.xml")
    return re.findall(r'https://[^/]+/ar/[^/]+/p\d+', sitemap)


def scrape_product(url: str, brand_name: str, country: str) -> dict | None:
    html = fetch(url)
    pid_match = re.search(r'/p(\d+)', url)
    pid = pid_match.group(1) if pid_match else ""

    name = ""
    name_match = re.search(r'<title>([^<]+)', html)
    if name_match:
        name = name_match.group(1).split("|")[0].strip(" -–")

    image = ""
    img_match = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', html)
    if img_match:
        image = img_match.group(1)

    desc = ""
    desc_match = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html)
    if desc_match:
        desc = desc_match.group(1)[:500]

    gender = "unisex"
    gender_match = re.search(r'رجالي|نسائي|للجنسين', html)
    if gender_match:
        raw = gender_match.group(0)
        if raw == "رجالي":
            gender = "male"
        elif raw == "نسائي":
            gender = "female"

    notes: dict[str, list[dict]] = {"top": [], "middle": [], "base": []}
    note_patterns = [
        (r'النوتة\s*العليا\s*(?:للعطر)?\s*:?\s*(.*?)(?:\s*</)', "top"),
        (r'النوتة\s*الوسطى\s*(?:للعطر)?\s*:?\s*(.*?)(?:\s*</)', "middle"),
        (r'النوتة\s*القاعدية\s*(?:للعطر)?\s*:?\s*(.*?)(?:\s*</)', "base"),
    ]
    for pat, layer in note_patterns:
        match = re.search(pat, html, re.DOTALL)
        if match:
            content = strip_html(match.group(1))
            for raw_name in re.split(r'[,;،]', content):
                raw_name = raw_name.strip()
                if raw_name and len(raw_name) < 50:
                    notes[layer].append({"id": "", "name": raw_name})

    skip_kw = re.compile(r'\b(بخور|دهن|مسك|معطرات|مبخرة|مقشر|مرطب|منظف|شامبو|بلسم|كريم|جسم|شعر|جو|هدية|مجموعة|gift|set|bakhoor|oud\s*oil|musk|body|hair|home|spray|incense|burner)\b', re.I)
    skip_text = f"{name} {desc} {html[:2000]}"
    if skip_kw.search(skip_text):
        return None

    return {
        "pid": pid,
        "name": name or f"Rasasi-{pid}",
        "brand": brand_name,
        "brand_country": country,
        "brand_logo": None,
        "perfumer": None,
        "year": None,
        "description": desc or None,
        "gender": {"label": gender, "distribution": {}},
        "accords": [],
        "notes": notes,
        "image_urls": [image] if image else [],
    }


def scrape_salla(brand: dict, limit: int) -> dict:
    name = brand["name"]
    base_url = brand["url"].rstrip("/")
    country = brand.get("country", "SA")

    print(f"  fetching sitemap from {base_url} ...")
    product_urls = fetch_sitemap_products(base_url)
    print(f"  {len(product_urls)} product URLs found in sitemap")

    perfumes = []
    for i, url in enumerate(product_urls):
        if limit and i >= limit:
            break
        print(f"  [{i+1}/{min(limit, len(product_urls))}] {url}")
        try:
            result = scrape_product(url, name, country)
            if result:
                perfumes.append(result)
        except Exception as e:
            print(f"    ⚠ error: {e}")
        time.sleep(1.5)

    return {
        "source": "salla",
        "source_url": base_url,
        "total_count": len(perfumes),
        "perfumes": perfumes,
        "brands": [{"id": "", "name": name, "country": country, "website": base_url}],
        "notes": [],
        "accords": [],
    }


def scrape_shopify(brand: dict, limit: int) -> dict:
    name = brand["name"]
    base_url = brand["url"].rstrip("/")
    country = brand.get("country", "AE")

    print(f"  fetching {base_url}/products.json?limit={limit} ...")
    data = fetch_json(f"{base_url}/products.json?limit={limit}")
    products = [p for p in data.get("products", []) if p.get("title", "").strip()]
    products = [p for p in products if not SET_KEYWORDS.search(p.get("title", ""))]
    print(f"  {len(products)} non-set products")

    perfumes = []
    for p in products:
        title = p.get("title", "").strip()
        handle = p.get("handle", "").strip()
        if not title or not handle:
            continue

        body = strip_html(p.get("body_html", "") or "")
        desc_match = re.search(r"^(.*?)(?:top\s*notes|note\s*pyramid|\.$)", body, re.I)
        description = (desc_match.group(1).strip() if desc_match else body[:300])[:500]
        notes = parse_notes(body)

        tags = p.get("tags", "")
        if isinstance(tags, list):
            tags = " ".join(str(t) for t in tags)
        gender = detect_gender(f"{title} {tags}")

        image_url = None
        images = p.get("images", [])
        if images and isinstance(images, list):
            image_url = images[0].get("src") if isinstance(images[0], dict) else None

        perfumes.append({
            "pid": handle,
            "name": title,
            "brand": name,
            "brand_country": country,
            "brand_logo": None,
            "perfumer": None,
            "year": None,
            "description": description or None,
            "gender": {"label": gender, "distribution": {}},
            "accords": [],
            "notes": notes,
            "image_urls": [image_url] if image_url else [],
        })

    return {
        "source": "shopify",
        "source_url": base_url,
        "total_count": len(perfumes),
        "perfumes": perfumes,
        "brands": [{"id": "", "name": name, "country": country, "website": base_url}],
        "notes": [],
        "accords": [],
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape official Arabic perfume stores.")
    parser.add_argument("--brand", help="Brand name to scrape (default: all in brands.json)")
    parser.add_argument("--limit", type=int, default=250, help="Max products per brand")
    args = parser.parse_args()

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    brands = json.loads(BRANDS_FILE.read_text(encoding="utf-8"))
    if args.brand:
        brands = [b for b in brands if b["name"].lower() == args.brand.lower()]
        if not brands:
            print(f"Brand '{args.brand}' not found in {BRANDS_FILE}")
            sys.exit(1)

    for brand in brands:
        name = brand["name"]
        scraper_type = brand["type"]
        print(f"\n{'='*50}")
        print(f"Scraping {name} ({scraper_type})")
        print(f"{'='*50}")

        if scraper_type == "shopify":
            result = scrape_shopify(brand, args.limit)
        elif scraper_type == "salla":
            result = scrape_salla(brand, args.limit)
        else:
            print(f"  ⚠ '{scraper_type}' scraper not yet implemented — skipping {name}")
            continue

        out_file = OUTPUT_DIR / f"{slugify(name)}_scraped.json"
        out_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

        with_notes = sum(1 for p in result["perfumes"] if p["notes"]["top"] or p["notes"]["middle"] or p["notes"]["base"])
        print(f"  ✓ {result['total_count']} perfumes ({with_notes} with note pyramids)")
        print(f"  → {out_file}")
        time.sleep(2)

    print("\nDone. Ingest with: pnpm db:seed perfume_scraper/output/<brand>_scraped.json")


if __name__ == "__main__":
    main()
