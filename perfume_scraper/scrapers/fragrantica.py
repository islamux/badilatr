"""
Fragrantica Scraper - Primary perfume database (FINAL v3)
=========================================================
Uses Playwright to bypass Cloudflare protection.

Key findings (verified):
- Search page works: /search/?t=perfumes&q={brand}
- Returns ~39-69 results per search (latest reviews with perfume links)
- Cloudflare triggers after ~2-3 rapid searches
- Solution: 15-20s delay between searches, restart browser on Cloudflare
- Individual perfume pages show wrong content (cache issue) - skip them
- Image CDN works: fimgs.net/mdimg/perfume-thumbs/375x500.{id}.jpg
"""

import re
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from .base import BasePlaywrightScraper

BASE_URL = "https://www.fragrantica.com"
PAGE_LOAD_TIMEOUT = 60000

BRAND_QUERIES = [
    # Niche Perfumes
    "Creed", "Xerjoff", "Amouage", "Byredo", "Maison Francis Kurkdjian",
    "Parfums de Marly", "Roja Parfums", "Clive Christian", "Frederic Malle",
    "Initio Parfums", "Mancera", "Montale", "Penhaligons", "Bond No 9",
    "Nishane", "Memo Paris", "Diptyque",
    # Designer Perfumes
    "Dior", "Chanel", "Tom Ford", "YSL", "Giorgio Armani",
    "Versace", "Prada", "Dolce Gabbana", "Gucci", "Bulgari",
    "Lancome", "Estee Lauder", "Calvin Klein", "Davidoff",
    "Hermes", "Givenchy", "Valentino", "Narciso Rodriguez",
    # Arabic / Oriental
    "Ajmal", "Swiss Arabian", "Rasasi", "Lattafa", "Al Haramain",
    "Khadlaj", "Arabiyat", "Ard Al Zaafaran", "Al Rehab",
    # Popular specific perfumes
    "Aventus", "Sauvage", "Bleu de Chanel", "One Million",
    "Oud Wood", "Interlude", "Layton", "Khamrah",
]


class FragranticaScraper(BasePlaywrightScraper):
    SOURCE = "fragrantica"
    OUTPUT_FILENAME = "fragrantica_data.json"
    RECORDS_KEY = "perfumes"
    LOCALE = "en-US"
    DELAY_MIN = 18.0  # Increased to avoid Cloudflare trigger
    DELAY_MAX = 30.0
    DEFAULT_MAX = 500

    def __init__(self, output_dir=None, max_perfumes=None, headless=True):
        super().__init__(output_dir=output_dir, max_items=max_perfumes, headless=headless)

    def _init_browser(self):
        """Restart-safe init: tear down any existing session before starting."""
        self._close_browser()
        super()._init_browser()

    def search_brand(self, brand_name):
        """Search for a brand on Fragrantica and extract perfume data."""
        url = f"{BASE_URL}/search/?t=perfumes&q={brand_name.replace(' ', '+')}"
        perfumes = []

        try:
            self.page.goto(url, timeout=PAGE_LOAD_TIMEOUT, wait_until="domcontentloaded")
            self.page.wait_for_timeout(4000)

            html = self.page.content()

            # Check for Cloudflare challenge
            if "Just a moment" in html[:2000] or "Attention Required" in html[:2000]:
                return None  # Signal that we need to restart

            soup = BeautifulSoup(html, "lxml")

            # Check title
            if "Just a moment" in self.page.title():
                return None

            # Find review cards (each card has rounded-xl class)
            cards = soup.find_all(
                "div",
                class_=lambda c: c and "rounded-xl" in c if c else False,
            )

            for card in cards:
                links = card.find_all("a", href=re.compile(r"/perfume/"))
                for link in links:
                    href = link.get("href", "")
                    match = re.search(
                        r"/perfume/([\w\s-]+)/([\w\s-]+)-(\d+)\.html", href
                    )
                    if match:
                        brand_parsed = match.group(1).replace("-", " ")
                        perfume_name = match.group(2).replace("-", " ")
                        perfume_id = match.group(3)

                        if perfume_id not in self.seen:
                            self.seen.add(perfume_id)
                            perfumes.append(
                                {
                                    "source": "fragrantica",
                                    "url": f"{BASE_URL}{href}",
                                    "perfume_id": perfume_id,
                                    "name": perfume_name,
                                    "brand": brand_parsed,
                                    "image_url": f"https://fimgs.net/mdimg/perfume-thumbs/375x500.{perfume_id}.jpg",
                                    "image_url_hires": f"https://fimgs.net/mdimg/perfume/375x500.{perfume_id}.jpg",
                                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                                }
                            )
                            self.collected += 1

                            if self.collected >= self.max_items:
                                break

                if self.collected >= self.max_items:
                    break

        except Exception as e:
            print(f"  [ERROR] Search failed for '{brand_name}': {e}")

        return perfumes

    def scrape_all_brands(self):
        """Scrape perfumes from all configured brand searches."""
        all_perfumes = []
        failed_brands = []
        retries = 0
        MAX_RETRIES = 3

        self._init_browser()

        self._section(
            "FRAGRANTICA SCRAPER (Playwright) - Starting",
            f"Brand queries: {len(BRAND_QUERIES)}",
            f"Max perfumes: {self.max_items}",
            f"Delay: {self.DELAY_MIN}-{self.DELAY_MAX}s between searches",
        )

        for i, brand in enumerate(BRAND_QUERIES):
            if self.collected >= self.max_items:
                break

            if retries > MAX_RETRIES:
                print(f"  [STOP] Too many retries, stopping scraper")
                break

            print(f"[{i + 1}/{len(BRAND_QUERIES)}] Query: '{brand}'")

            try:
                result = self.search_brand(brand)

                if result is None:
                    # Cloudflare triggered - restart browser with longer delay
                    retries += 1
                    print(f"  [RESTART] Cloudflare detected (retry {retries}/{MAX_RETRIES}), restarting browser...")
                    self._close_browser()
                    self._random_delay(20, 35)
                    self._init_browser()
                    result = self.search_brand(brand)

                if result is not None:
                    all_perfumes.extend(result)
                    if len(result) > 0:
                        print(f"  → Got {len(result)} perfumes (total: {self.collected})")
                    else:
                        print(f"  → 0 new perfumes (total: {self.collected})")
                else:
                    failed_brands.append(brand)
                    print(f"  ✗ No results after retry")

            except Exception as e:
                print(f"  ✗ Failed: {brand} - {e}")
                failed_brands.append(brand)

            if self.collected < self.max_items and i < len(BRAND_QUERIES) - 1:
                self._random_delay()

        self._close_browser()

        if all_perfumes:
            self._save_results(all_perfumes)

        self._section(
            "FRAGRANTICA SCRAPER - Complete",
            f"Total perfumes collected: {len(all_perfumes)}",
            f"Failed brands: {len(failed_brands)}",
        )

        return all_perfumes, failed_brands


if __name__ == "__main__":
    scraper = FragranticaScraper(max_perfumes=50)
    perfumes, failed = scraper.scrape_all_brands()
    print(f"\nDone! Collected {len(perfumes)} perfumes.")
    if failed:
        print(f"Failed brands: {failed}")
