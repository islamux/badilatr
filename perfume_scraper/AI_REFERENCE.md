# Perfume Scraper Project — AI Reference Document

> This document serves as a comprehensive technical reference for any AI model working on or extending the Perfume Scraper project. It documents the architecture, data schemas, technical decisions, challenges encountered, and the exact behavior of each component.

---

## 1. Project Summary

The Perfume Scraper is a Python-based data collection system that extracts structured perfume data from multiple online sources and stores it as JSON files. The system was built for a Next.js 16+ frontend application, which expects JSON data that can be processed further. The project uses a modular architecture with a main orchestrator (`main.py`) and four individual scraper modules.

The primary data source is **FragDB**, a structured fragrance database that provides CSV files downloadable from GitHub. Secondary sources include **Fragrantica** (live scraping via Playwright), **Basenotes**, and **Notino**. Each scraper saves its results independently to the `output/` directory, and the orchestrator merges and deduplicates all results into a single `merged_data.json` file.

---

## 2. Project Structure

```
perfume_scraper/
├── main.py                          # Orchestrator: runs scrapers, merges results
├── requirements.txt                 # Python dependencies
├── README.md                        # User-facing documentation
├── AI_REFERENCE.md                  # This file — AI model reference
├── scrapers/
│   ├── __init__.py                  # Package init (exports all scrapers)
│   ├── fragdb.py                    # FragDB scraper (CSV → JSON)
│   ├── fragrantica.py               # Fragrantica scraper (Playwright)
│   ├── basenotes.py                 # Basenotes scraper (Playwright)
│   └── notino.py                    # Notino scraper (Playwright + Requests)
├── output/
│   ├── fragdb_data.json             # FragDB output (rich structured data)
│   ├── fragrantica_data.json        # Fragrantica output (search results)
│   ├── basenotes_data.json          # Basenotes output (if available)
│   ├── notino_prices.json           # Notino output (pricing data)
│   └── merged_data.json             # Combined + deduplicated results
└── data/
    └── fragrantica_findings_v2.txt  # Technical notes from testing
```

---

## 3. Dependencies

The project requires the following Python packages, all specified in `requirements.txt`:

| Package | Version | Purpose |
|---------|---------|---------|
| `requests` | >=2.31.0 | HTTP requests for CSV downloads and API calls |
| `beautifulsoup4` | >=4.12.0 | HTML parsing for web scraping |
| `lxml` | >=4.9.0 | Fast HTML/XML parser used by BeautifulSoup |
| `fake-useragent` | >=1.5.0 | Random User-Agent rotation |
| `cloudscraper` | >=1.2.71 | Cloudflare bypass for simple requests |
| `playwright` | >=1.40.0 | Browser automation for protected sites |

Playwright requires an additional step after installation: `playwright install chromium` must be run to download the browser binary.

---

## 4. Scrapers Detail

### 4.1. FragDB Scraper (`scrapers/fragdb.py`)

This is the primary and most reliable scraper. It downloads pipe-delimited CSV files from the FragDB GitHub repository and converts them into structured JSON.

**Data Source**: The FragDB repository at https://github.com/FragDB/fragrance-database provides CSV samples under the `samples/` directory. The full database contains 135,308+ fragrances, 8,093 brands, 2,573 notes, and 3,057 perfumers, with translations in 23 languages. The free sample contains 10 records per table. The full database is available for purchase at $200 (Core CSV) or $400 (Full with Parquet review datasets).

**CSV Files Downloaded**:

| File | URL Pattern | Fields |
|------|-------------|--------|
| `fragrances.csv` | `samples/fragrances.csv` | pid, name, brand, slug, year, gender, rating, notes_pyramid, accords, description, season, time_of_day, longevity, sillage, price_value, appreciation, pros_cons, photo, reviews_count |
| `brands.csv` | `samples/brands.csv` | id, name, country, website, parent_company, logo |
| `perfumers.csv` | `samples/perfumers.csv` | id, name, status, company, education, biography |
| `notes.csv` | `samples/notes.csv` | id, name, latin_name, group, odor_profile, note_name_ar (and 21 other languages) |
| `accords.csv` | `samples/accords.csv` | id, name, color |

**Key Parsing Logic**:

The scraper includes several specialized parsing functions:

1. `parse_notes_pyramid()`: Parses the `notes_pyramid` field which uses a custom format like `top(n2415,1.0,5.0;n146,0.96,3.67)middle(n42,0.85,3.05)base(n2260,0.85,3.05)`. Each note has an ID (with `n` prefix), opacity (0.0–1.0), and weight. The function extracts top, middle, and base layers separately and looks up note names from the `notes_map` built from the downloaded notes CSV.

2. `parse_accords()`: Parses the `accords` field which uses the format `a24:100;a91:75;a33:63` where each accord has an ID (with `a` prefix) and an intensity percentage.

3. `parse_vote_data()`: Parses vote distribution strings like `like_love:11700:32.39;like_like:15000:41.67` into a dictionary of vote categories with counts and percentages.

4. `parse_rating()`: Parses rating strings like `3.86;36106` into average score and total number of ratings.

5. `_parse_image_urls()`: Extracts image URLs from the `photo` field. If the field is empty, it constructs fallback thumbnail URLs using the Fragrantica CDN pattern: `https://fimgs.net/mdimg/perfume-thumbs/375x500.{pid}.jpg`.

6. `extract_description_text()`: Strips HTML tags from the description field and returns the first sentence.

**Important Note on Note IDs**: The note IDs in the pyramid (e.g., `n2415`) match the format used in the notes CSV. However, the free sample only contains 10 notes, so most pyramid note IDs will not have a matching name in the lookup map. The scraper falls back to using the raw ID as the name in such cases.

### 4.2. Fragrantica Scraper (`scrapers/fragrantica.py`)

This scraper uses Playwright to automate a headless Chromium browser for scraping Fragrantica's search results.

**Technical Findings**:

Fragrantica is heavily protected by Cloudflare. Through extensive testing, the following behavior was documented:

The first search query typically succeeds and returns 39–69 results. The second query may also succeed. By the third query, Cloudflare triggers a "Just a moment..." challenge page, blocking further requests. This rate limiting is session-based, meaning it tracks browser state rather than IP address alone.

**Implementation Strategy**:

The scraper implements a session management strategy to handle this limitation. It performs a maximum of 2 searches per browser session. After 2 searches, it closes the entire browser (not just the page) and creates a fresh browser instance with new cookies and state. When a Cloudflare challenge is detected, it immediately restarts the browser with a longer delay (20–35 seconds) before retrying.

Random delays of 18–30 seconds are enforced between searches to further reduce the likelihood of triggering rate limits.

**Data Extraction**:

The scraper navigates to the search URL pattern `https://www.fragrantica.com/search/?t=perfumes&q={brand}`. It waits for `domcontentloaded` (not `networkidle`, which often times out on Fragrantica). After a 4-second wait for JavaScript rendering, it parses the HTML to find review cards containing links to perfume pages. From each link, it extracts the brand, perfume name, and perfume ID using a regex pattern matching `/perfume/{brand}/{name}-{id}.html`.

Individual perfume detail pages were tested but consistently return incorrect content (showing a different perfume than requested), likely due to server-side caching or JavaScript rendering issues. Therefore, the scraper only collects data from search result pages.

**Image URLs**:

Since individual pages cannot be reliably scraped, image URLs are constructed using the Fragrantica CDN pattern based on the perfume ID extracted from the search results.

### 4.3. Basenotes Scraper (`scrapers/basenotes.py`)

This scraper was designed to collect supplementary reviews and data from Basenotes (now basenotes.com). It uses Playwright for browser automation.

**Current Status**: The Basenotes website is currently experiencing technical issues. All requests return either a "404 Not Found" or an "Oops! We ran into some problems" error page. The scraper is functional but cannot produce data until the website is restored.

### 4.4. Notino Scraper (`scrapers/notino.py`)

This scraper collects pricing and availability data from Notino, a European fragrance e-commerce platform. It uses both Playwright (for SPA rendering) and direct HTTP requests.

**Technical Notes**: Notino uses regional subdomains (e.g., `notino.co.uk`, `notino.de`) and redirects search queries to the homepage if the region is not properly configured. The scraper implements a Playwright-based approach that navigates to the search page and waits for the SPA to render product cards. However, in practice, Notino also redirects to the homepage, suggesting that geographic restrictions or Cloudflare protection may be active.

---

## 5. Data Schema — Complete Reference

### 5.1. Perfume Record (FragDB Source)

```json
{
  "source": "fragdb",
  "pid": "485",
  "name": "Light Blue",
  "brand": "Dolce&Gabbana",
  "brand_id": "b72",
  "brand_country": "Italy",
  "brand_logo": "https://...",
  "brand_website": "https://...",
  "brand_parent_company": null,
  "perfumer": "Olivier Cresp",
  "perfumer_id": "p39",
  "year": 2001,
  "gender": {
    "label": "gender_for_women",
    "distribution": {
      "gvotes_female": {"count": 3600, "percentage": 37.0},
      "gvotes_more_female": {"count": 2600, "percentage": 27.0},
      "gvotes_unisex": {"count": 3300, "percentage": 34.0},
      "gvotes_more_male": {"count": 164, "percentage": 2.0},
      "gvotes_male": {"count": 104, "percentage": 1.0}
    }
  },
  "description": "Light Blue by Dolce&Gabbana is a Floral Fruity fragrance...",
  "rating": {
    "average": 3.86,
    "total_ratings": 36106,
    "votes": {
      "love": 11700,
      "like": 15000,
      "ok": 2700,
      "dislike": 6100,
      "hate": 629
    },
    "total_votes": 43729
  },
  "notes": {
    "top": [
      {"id": "n2415", "name": "Lemon", "opacity": "1.0", "weight": "5.0"}
    ],
    "middle": [
      {"id": "n42", "name": "Jasmine", "opacity": "0.85", "weight": "3.05"}
    ],
    "base": [
      {"id": "n2260", "name": "Musk", "opacity": "0.85", "weight": "3.05"}
    ]
  },
  "accords": [
    {"id": "a24", "name": "citrus", "color": null, "intensity": 100}
  ],
  "longevity": {
    "label": "moderate",
    "distribution": {
      "longevity_very_weak": {"count": 1100, "percentage": 9.0},
      "longevity_weak": {"count": 3100, "percentage": 24.0},
      "longevity_moderate": {"count": 6500, "percentage": 49.0},
      "longevity_long_lasting": {"count": 1900, "percentage": 15.0},
      "longevity_eternal": {"count": 529, "percentage": 4.0}
    }
  },
  "sillage": {
    "label": "moderate",
    "distribution": {
      "sillage_intimate": {"count": 3400, "percentage": 27.0},
      "sillage_moderate": {"count": 7000, "percentage": 54.0},
      "sillage_strong": {"count": 1900, "percentage": 15.0},
      "sillage_enormous": {"count": 539, "percentage": 4.0}
    }
  },
  "best_season": {
    "winter": 11.0,
    "spring": 54.72,
    "summer": 100.0,
    "fall": 12.26
  },
  "best_time": {
    "day": 94.79,
    "night": 11.69
  },
  "price_value": {
    "way_overpriced": 5.0,
    "overpriced": 21.0,
    "ok": 49.0,
    "good_value": 20.0,
    "great_value": 4.0
  },
  "reviews_count": 2500,
  "pros_cons": {
    "pros": [
      {"text": "Clean and fresh scent", "count": 813},
      {"text": "Good for summer season", "count": 751}
    ],
    "cons": [
      {"text": "May not work well with certain body chemistries", "count": 279},
      {"text": "Sharp screechy citrus opening for some", "count": 301}
    ]
  },
  "image_urls": [
    "https://fimgs.net/mdimg/perfume-thumbs/375x500.485.jpg",
    "https://fimgs.net/mdimg/perfume/375x500.485.jpg"
  ],
  "url": "https://www.fragrantica.com/perfume/Dolce-Gabbana/Light-Blue.html",
  "scraped_at": "2026-07-25T13:49:51.297877+00:00"
}
```

### 5.2. Perfume Record (Fragrantica Source)

The Fragrantica scraper produces lighter records with fewer fields, since it only extracts data from search results:

```json
{
  "source": "fragrantica",
  "url": "https://www.fragrantica.com/perfume/Creed/Bois-du-Portugal-3805.html",
  "perfume_id": "3805",
  "name": "Bois du Portugal",
  "brand": "Creed",
  "image_url": "https://fimgs.net/mdimg/perfume-thumbs/375x500.3805.jpg",
  "image_url_hires": "https://fimgs.net/mdimg/perfume/375x500.3805.jpg",
  "scraped_at": "2026-07-25T12:00:00+00:00"
}
```

### 5.3. Product Record (Notino Source)

```json
{
  "source": "notino",
  "url": "https://www.notino.co.uk/...",
  "name": "Aventus",
  "brand": "Creed",
  "price": 250.0,
  "original_price": 300.0,
  "discount_percent": 17,
  "currency": "USD",
  "size": "100ml",
  "image_url": "https://...",
  "rating": 4.3,
  "review_count": 120,
  "availability": "in_stock",
  "scraped_at": "2026-07-25T12:00:00+00:00"
}
```

### 5.4. Merged Output Structure

The `merged_data.json` file follows this structure:

```json
{
  "merged_at": "2026-07-25T13:50:00+00:00",
  "sources": {
    "fragdb": {
      "file": "output/fragdb_data.json",
      "records": 10,
      "scraped_at": "...",
      "data_version": "v5.10",
      "source_url": "https://github.com/FragDB/fragrance-database"
    },
    "fragrantica": {
      "file": "output/fragrantica_data.json",
      "records": 15,
      "scraped_at": "..."
    }
  },
  "total_perfumes": 25,
  "unique_perfumes": 25,
  "total_products": 0,
  "perfumes": [...],
  "products": [...]
}
```

The deduplication logic uses a key of `{brand}|{name}` to identify and remove duplicate perfume records across sources.

---

## 6. Command-Line Interface

The orchestrator supports the following flags:

| Flag | Description |
|------|-------------|
| `--fragdb` | Run the FragDB scraper (recommended, fastest) |
| `--fragrantica` | Run the Fragrantica scraper (slow, rate-limited) |
| `--basenotes` | Run the Basenotes scraper (currently unavailable) |
| `--notino` | Run the Notino scraper (needs regional access) |
| `--all` | Run all four scrapers |
| `--merge` | Merge existing JSON files without running any scraper |
| `--limit N` | Maximum number of items per scraper (default: 50) |

Multiple flags can be combined. For example, `python main.py --fragdb --fragrantica --limit 100` runs both FragDB and Fragrantica with a limit of 100 items each.

---

## 7. Technical Constraints and Known Issues

### 7.1. Fragrantica Rate Limiting

Fragrantica's Cloudflare protection triggers after approximately 2–3 search requests per browser session. The scraper handles this by restarting the browser after every 2 successful searches and implementing 18–30 second random delays. Even with these measures, the effective throughput is approximately 15–20 perfumes per minute. For large-scale data collection, purchasing the full FragDB database is significantly more efficient.

### 7.2. Fragrantica Page Caching

Individual perfume detail pages on Fragrantica consistently return incorrect content when accessed via Playwright, showing a different perfume than the one requested. This appears to be a server-side caching issue. The scraper avoids this problem by only extracting data from search result pages.

### 7.3. Basenotes Downtime

The Basenotes website (basenotes.com) is currently returning error pages for all requests. The scraper code is functional but cannot produce data until the website is restored.

### 7.4. Notino Regional Restrictions

Notino uses regional subdomains and may redirect search queries to the homepage if the user's IP or locale is not properly configured. The scraper requires regional configuration and may need proxy rotation to function in production.

### 7.5. FragDB Free Sample Limitation

The free FragDB sample contains only 10 records per table. This is sufficient for development and testing but not for production use. To get the full 135,000+ records, the full database must be purchased from fragdb.net.

---

## 8. Extending the Project

### 8.1. Adding a New Scraper

To add a new data source:

1. Create a new file in `scrapers/` (e.g., `scrapers/newsource.py`).
2. Implement a function that returns a tuple of `(records, failed_items)`.
3. Save results to a JSON file in the `output/` directory using the standard format.
4. Add an import and a `run_*` function in `main.py`.
5. Add the corresponding command-line flag and execution block in `main()`.
6. Update the `json_files` dictionary in `merge_all_data()` to include the new file.

### 8.2. Customizing Brand Lists

The Fragrantica scraper uses a `BRAND_QUERIES` list at the top of the file. This can be modified to include any brand or perfume name. The search is fuzzy, so partial matches are returned.

### 8.3. Image Download

The project currently stores image URLs but does not download the actual images. To add image downloading, a separate module can be created that reads the `image_urls` fields from the JSON files and downloads them to a local directory.

### 8.4. Full Database Integration

If the full FragDB database is purchased, the scraper can be updated to load the full CSV files instead of the sample files by changing the `CSV_FILES` dictionary in `scrapers/fragdb.py` to point to the full file paths.

---

## 9. File Sizes and Performance

| File | Size | Records | Notes |
|------|------|---------|-------|
| `fragdb_data.json` | ~200 KB | 10 perfumes (sample) | Includes brands, notes, accords, perfumers reference data |
| `fragrantica_data.json` | ~7 KB | 15 perfumes | Lightweight records with IDs and image URLs |
| `merged_data.json` | ~86 KB | 25 perfumes | Combined and deduplicated |

With the full FragDB database (135,000+ records), the output file would be approximately 250–400 MB depending on data density.

---

## 10. License and Attribution

The FragDB data is licensed under **CC-BY-NC-4.0** (Creative Commons Attribution-NonCommercial 4.0). This means the data can be used for non-commercial purposes with attribution. For commercial use, a license must be obtained from fragdb.net.

The scraper code itself has no external license restrictions.

---

*Document generated on 2026-07-25. Data refreshed from FragDB v5.10 on 2026-07-20.*
