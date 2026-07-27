"""
Notino Scraper - Price and availability data
============================================
Uses Playwright to handle SPA rendering and regional redirects.

Strategy:
1. Navigate to Notino UK (most accessible region)
2. Search for perfume names
3. Extract product data from rendered page
4. Notino redirects to regional sites; UK is most stable

Note: notino.com redirects to regional sites. notino.co.uk is the UK version.
"""

import re
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from .base import BasePlaywrightScraper

BASE_URL = "https://www.notino.co.uk"
PAGE_LOAD_TIMEOUT = 60000

SEARCH_QUERIES = [
    "Creed Aventus", "Tom Ford Oud Wood", "Dior Sauvage",
    "Bleu de Chanel", "YSL Y", "Amouage Interlude",
    "Parfums de Marly Layton", "Initio Atomic Pulse",
    "Xerjoff Erba Pura", "Mancera Red Tobacco",
    "Byredo Gypsy Water", "MFK Baccarat Rouge 540",
    "Roja Enigma", "Penhaligons Halfeti", "Frederic Malle Portrait",
    "Creed Silver Mountain Water", "Dior Homme Intense",
    "Versace Eros", "Prada L'Homme", "Armani Code",
    "Lattafa Khamrah", "Al Haramain Amber Oud", "Rasasi Hawas",
    "Mancera Aoud Lemon Mint", "Montale Intense Cafe",
]


class NotinoScraper(BasePlaywrightScraper):
    SOURCE = "notino"
    OUTPUT_FILENAME = "notino_prices.json"
    RECORDS_KEY = "products"
    LOCALE = "en-GB"
    DELAY_MIN = 3.0
    DELAY_MAX = 6.0
    DEFAULT_MAX = 200

    def __init__(self, output_dir=None, max_products=None, headless=True):
        super().__init__(output_dir=output_dir, max_items=max_products, headless=headless)

    def _parse_price(self, price_text):
        """Parse price string to float value."""
        if not price_text:
            return None
        try:
            clean = re.sub(r'[^\d.,]', '', price_text)
            clean = clean.replace(',', '.').replace(' ', '')
            return float(clean)
        except (ValueError, AttributeError):
            return None

    def search_perfume(self, query):
        """Search for a perfume on Notino and extract results."""
        url = f"{BASE_URL}/search/?q={query.replace(' ', '+')}"
        products = []

        try:
            self.page.goto(url, timeout=PAGE_LOAD_TIMEOUT, wait_until="domcontentloaded")
            self.page.wait_for_timeout(5000)

            content = self.page.content()
            title = self.page.title()

            # Check if Cloudflare blocked us
            if "Just a moment" in title or "Attention Required" in title:
                print("    [WARN] Cloudflare challenge on Notino")
                return []

            soup = BeautifulSoup(content, "lxml")

            # Try multiple selectors for product cards
            product_cards = []

            # Selector 1: data-testid
            product_cards = soup.find_all(attrs={"data-testid": "product-card"})

            # Selector 2: article tags
            if not product_cards:
                product_cards = soup.find_all("article")

            # Selector 3: links with product patterns
            if not product_cards:
                all_links = soup.find_all("a", href=re.compile(r'/[a-z].*?/'))
                for link in all_links:
                    href = link.get("href", "")
                    if "/" in href and len(href) > 20:
                        product_cards.append(link.parent)

            for card in product_cards:
                if self.collected >= self.max_items:
                    break

                product_data = self._extract_product_data(card)
                if product_data and product_data["url"] and product_data["url"] not in self.seen:
                    self.seen.add(product_data["url"])
                    products.append(product_data)
                    self.collected += 1
                    print(f"    ✓ {product_data['name']} - £{product_data.get('price', 'N/A')}")

        except Exception as e:
            print(f"  [ERROR] Search failed for '{query}': {e}")

        return products

    def _extract_product_data(self, element):
        """Extract product data from a product card element."""
        try:
            data = {
                "source": "notino",
                "url": None,
                "name": None,
                "brand": None,
                "price": None,
                "original_price": None,
                "discount_percent": None,
                "size": None,
                "image_url": None,
                "rating": None,
                "review_count": None,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }

            # Extract link
            link = element.find("a", href=True)
            if link:
                href = link.get("href")
                data["url"] = href if href.startswith("http") else BASE_URL + href

            # Extract name
            name_tag = element.find("h2") or element.find("h3") or element.find("p", class_=re.compile(r"name|title"))
            if name_tag:
                data["name"] = name_tag.get_text(strip=True)

            # Extract brand
            brand_tag = element.find("span", class_=re.compile(r"brand")) or element.find("p", class_=re.compile(r"brand"))
            if brand_tag:
                data["brand"] = brand_tag.get_text(strip=True)

            # Extract price
            price_tag = element.find("span", class_=re.compile(r"price|amount|current"))
            if not price_tag:
                price_tag = element.find("p", class_=re.compile(r"price|amount"))
            if price_tag:
                data["price"] = self._parse_price(price_tag.get_text(strip=True))

            # Extract original price
            orig_tag = element.find("span", class_=re.compile(r"original|regular|old"))
            if orig_tag:
                data["original_price"] = self._parse_price(orig_tag.get_text(strip=True))

            # Extract discount
            discount_tag = element.find("span", class_=re.compile(r"discount|sale|off"))
            if discount_tag:
                match = re.search(r'(\d+)%', discount_tag.get_text(strip=True))
                if match:
                    data["discount_percent"] = int(match.group(1))

            # Extract image
            img = element.find("img")
            if img:
                src = img.get("src") or img.get("data-src")
                if src:
                    data["image_url"] = src if src.startswith("http") else BASE_URL + src

            return data

        except Exception as e:
            print(f"    [WARN] Product extraction failed: {e}")
            return None

    def scrape_all_products(self):
        """Scrape products from all configured search queries."""
        all_products = []
        failed_queries = []

        self._init_browser()

        self._section(
            "NOTINO SCRAPER (Playwright) - Starting",
            f"Base URL: {BASE_URL}",
            f"Search queries: {len(SEARCH_QUERIES)}",
            f"Max products: {self.max_items}",
        )

        for query in SEARCH_QUERIES:
            if self.collected >= self.max_items:
                break

            print(f"[SEARCH] Query: '{query}'")
            try:
                products = self.search_perfume(query)
                all_products.extend(products)
                print(f"  → Got {len(products)} products (total: {self.collected})")
            except Exception as e:
                print(f"  ✗ Failed: {query} - {e}")
                failed_queries.append(query)

            self._random_delay()

        self._close_browser()

        if all_products:
            self._save_results(all_products, extra={"region": BASE_URL})

        self._section(
            "NOTINO SCRAPER - Complete",
            f"Total products collected: {len(all_products)}",
            f"Failed queries: {len(failed_queries)}",
        )

        return all_products, failed_queries


if __name__ == "__main__":
    scraper = NotinoScraper(max_products=30)
    products, failed = scraper.scrape_all_products()
    print(f"\nDone! Collected {len(products)} products.")
    if failed:
        print(f"Failed queries: {failed}")
