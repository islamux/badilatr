# Rasasi Salla Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) for syntax tracking.

**Goal:** Add a `"salla"` scraper type to `scrape_official.py` that scrapes Rasasi's Salla store via sitemap discovery + per-product HTML extraction.

**Architecture:** Parse sitemap-2.xml for product URLs → fetch each product page → extract name/notes/gender/price/image via regex → filter non-perfume → emit FragDB-shaped JSON. All stdlib (`urllib` + `re`), no new dependencies.

**Tech Stack:** Python 3.13, stdlib only

---

### Task 1: Add sitemap discovery and product URL extraction

- [ ] **Step 1: Add `fetch_sitemap_products()` to `scrape_official.py`**

Add after `detect_gender()` (line 69):

```python
def fetch_sitemap_products(base_url: str) -> list[str]:
    sitemap = fetch(f"{base_url.rstrip('/')}/ar/sitemap-2.xml")
    return re.findall(r'https://[^/]+/ar/[^/]+/p\d+', sitemap)
```

- [ ] **Step 2: Add `scrape_product()` to extract fields from a single product page**

Add after `fetch_sitemap_products()`:

```python
def scrape_product(url: str, brand_name: str, country: str) -> dict | None:
    html = fetch(url)
    pid_match = re.search(r'/p(\d+)', url)
    pid = pid_match.group(1) if pid_match else ""

    name = ""
    name_match = re.search(r'<title>([^<]+)', html)
    if name_match:
        name = name_match.group(1).split("|")[0].strip(" -–")

    price = 0
    price_match = re.search(r'"price":(\d+\.?\d*)', html)
    if price_match:
        price = float(price_match.group(1))

    image = ""
    img_match = re.search(r'<meta\s+property="og:image"\s+content="([^"]+)"', html)
    if img_match:
        image = img_match.group(1)

    desc = ""
    desc_match = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html)
    if desc_match:
        desc = desc_match.group(1)[:500]

    # Gender from subtitle
    gender = "unisex"
    gender_match = re.search(r'رجالي|نسائي|للجنسين', html)
    if gender_match:
        raw = gender_match.group(0)
        if raw == "رجالي":
            gender = "male"
        elif raw == "نسائي":
            gender = "female"

    # Arabic note patterns
    notes: dict[str, list[dict]] = {"top": [], "middle": [], "base": []}
    note_patterns = [
        (r'النوتة\s*العليا\s*:?\s*(.*?)(?=النوتة\s*(?:الوسطى|القاعدية)|$)', "top"),
        (r'النوتة\s*الوسطى\s*:?\s*(.*?)(?=النوتة\s*(?:القاعدية)|$)', "middle"),
        (r'النوتة\s*القاعدية\s*:?\s*(.*?)$', "base"),
    ]
    for pat, layer in note_patterns:
        match = re.search(pat, html, re.DOTALL)
        if match:
            for raw_name in re.split(r'[,;،]', match.group(1)):
                raw_name = raw_name.strip().strip('ي')
                if raw_name and len(raw_name) < 50:
                    notes[layer].append({"id": "", "name": raw_name})

    # Skip non-perfume
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
```

- [ ] **Step 3: Add `scrape_salla()` function**

Add after `scrape_product()`:

```python
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
```

### Task 2: Wire `scrape_salla` into main dispatch

- [ ] **Step 1: Add the dispatch condition in `main()`**

Edit the dispatch block at lines 165-169:

Old:
```python
        if scraper_type == "shopify":
            result = scrape_shopify(brand, args.limit)
        else:
            print(f"  ⚠ '{scraper_type}' scraper not yet implemented — skipping {name}")
            continue
```

New:
```python
        if scraper_type == "shopify":
            result = scrape_shopify(brand, args.limit)
        elif scraper_type == "salla":
            result = scrape_salla(brand, args.limit)
        else:
            print(f"  ⚠ '{scraper_type}' scraper not yet implemented — skipping {name}")
            continue
```

### Task 3: Dry-run and verify

- [ ] **Step 1: Run with limit 3 to verify extraction works**

```bash
python3 perfume_scraper/scrape_official.py --brand Rasasi --limit 3
```

Expected output shows 3 products with notes extracted, then prints ✓.

- [ ] **Step 2: Inspect output JSON**

```bash
python3 -c "
import json
data = json.load(open('perfume_scraper/output/rasasi_scraped.json'))
for p in data['perfumes']:
    print(p['name'], '-', len(p['notes']['top']), 'top,', len(p['notes']['middle']), 'mid,', len(p['notes']['base']), 'base notes')
"
```

Expect at least some products with note pyramids.

- [ ] **Step 3: Run full scrape (no limit)**

```bash
python3 perfume_scraper/perfume_scraper/scrape_official.py --brand Rasasi
```

### Task 4: Seed and smoke test

- [ ] **Step 1: Seed the Rasasi data**

```bash
pnpm db:seed perfume_scraper/output/rasasi_scraped.json
```

- [ ] **Step 2: Verify seeded perfumes appear in DB**

```bash
pnpm db:health
```

- [ ] **Step 3: Run all gates**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

### Task 5: Commit

- [ ] **Step 1: Commit changes**

```bash
git add perfume_scraper/scrape_official.py docs/superpowers/plans/2026-07-28-rasasi-salla-scraper.md
git commit -m "feat: add Salla scraper for Rasasi (sitemap + HTML extraction)"
```

### Task 6: Lattafa Investigation (Deferred)

No code changes — research only when Rasasi is done.
