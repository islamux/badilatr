"""
Basenotes Scraper - Supplementary perfume data
==============================================
Uses Playwright to bypass Cloudflare protection.

Strategy:
1. Search for brand names on Basenotes
2. Extract perfume data from search results
3. Visit individual perfume pages for detailed notes
4. Basenotes has Cloudflare protection (tested)

URL Pattern: /perfume/{Slug}
Search: /search/{query}
"""

import re
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from .base import BasePlaywrightScraper

BASE_URL = "https://www.basenotes.net"
PAGE_LOAD_TIMEOUT = 60000

BRAND_QUERIES = [
    "Creed", "Tom Ford", "Dior", "Chanel", "YSL",
    "Xerjoff", "Amouage", "Byredo", "Roja", "Mancera",
    "Montale", "Penhaligons", "Armani", "Prada", "Versace",
    "Gucci", "Bulgari", "Hermes", "Givenchy", "Valentino",
    "Ajmal", "Swiss Arabian", "Rasasi", "Lattafa", "Al Haramain",
    "Clive Christian", "Frederic Malle", "Initio", "Parfums de Marly",
    "MFK", "Bond No 9", "Memo Paris", "Diptyque",
]


class BasenotesScraper(BasePlaywrightScraper):
    SOURCE = "basenotes"
    OUTPUT_FILENAME = "basenotes_data.json"
    RECORDS_KEY = "perfumes"
    LOCALE = "en-US"
    DELAY_MIN = 3.0
    DELAY_MAX = 6.0
    DEFAULT_MAX = 300

    def __init__(self, output_dir=None, max_perfumes=None, headless=True):
        super().__init__(output_dir=output_dir, max_items=max_perfumes, headless=headless)

    def _extract_perfume_from_search(self, soup, base_url):
        """Extract perfume data from search results page."""
        perfumes = []

        links = soup.find_all("a", href=re.compile(r"/perfume/"))

        for link in links:
            href = link.get("href", "")
            match = re.search(r"/perfume/([\w-]+)", href)
            if match:
                slug = match.group(1)
                if slug not in self.seen:
                    self.seen.add(slug)

                    perfumes.append(
                        {
                            "source": "basenotes",
                            "url": f"{base_url}{href}",
                            "slug": slug,
                            "name": link.get_text(strip=True) or slug,
                            "scraped_at": datetime.now(timezone.utc).isoformat(),
                        }
                    )
                    self.collected += 1

                    if self.collected >= self.max_items:
                        break

        return perfumes

    def search_brand(self, brand_name):
        """Search for a brand on Basenotes."""
        url = f"{BASE_URL}/search/{brand_name.replace(' ', '-')}"
        perfumes = []

        try:
            self.page.goto(url, timeout=PAGE_LOAD_TIMEOUT, wait_until="domcontentloaded")
            self.page.wait_for_timeout(5000)

            content = self.page.content()
            title = self.page.title()

            if "Attention Required" in title or "Cloudflare" in title:
                print("    [WARN] Cloudflare challenge on Basenotes")
                return []

            soup = BeautifulSoup(content, "lxml")
            perfumes = self._extract_perfume_from_search(soup, BASE_URL)

        except Exception as e:
            print(f"  [ERROR] Search failed for '{brand_name}': {e}")

        return perfumes

    def scrape_all_brands(self):
        """Scrape perfumes from all configured brand searches."""
        all_perfumes = []
        failed_brands = []

        self._init_browser()

        self._section(
            "BASENOTES SCRAPER (Playwright) - Starting",
            f"Brand queries: {len(BRAND_QUERIES)}",
            f"Max perfumes: {self.max_items}",
        )

        for brand in BRAND_QUERIES:
            if self.collected >= self.max_items:
                break

            print(f"[SEARCH] Query: '{brand}'")
            try:
                perfumes = self.search_brand(brand)
                all_perfumes.extend(perfumes)
                print(f"  → Got {len(perfumes)} perfumes (total: {self.collected})")
            except Exception as e:
                print(f"  ✗ Failed: {brand} - {e}")
                failed_brands.append(brand)

            self._random_delay()

        self._close_browser()

        if all_perfumes:
            self._save_results(all_perfumes)

        self._section(
            "BASENOTES SCRAPER - Complete",
            f"Total perfumes collected: {len(all_perfumes)}",
            f"Failed brands: {len(failed_brands)}",
        )

        return all_perfumes, failed_brands


if __name__ == "__main__":
    scraper = BasenotesScraper(max_perfumes=30)
    perfumes, failed = scraper.scrape_all_brands()
    print(f"\nDone! Collected {len(perfumes)} perfumes.")
    if failed:
        print(f"Failed brands: {failed}")
