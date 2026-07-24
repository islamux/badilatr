from __future__ import annotations

import json
import re

from bs4 import BeautifulSoup

from models import (
    ScrapedBrand,
    ScrapedNote,
    ScrapedPerfume,
    detect_concentration,
    detect_family,
    detect_gender,
    slugify,
)
from sites.base import BaseScraper


ARABIC_NOTE_LAYERS = {
    "النوتة العليا": "top",
    "النوتة الوسطى": "heart",
    "النوتة القاعدية": "base",
    "النوتات العليا": "top",
    "النوتات الوسطى": "heart",
    "النوتات القاعدية": "base",
    "top notes": "top",
    "middle notes": "heart",
    "base notes": "base",
}


class SallaScraper(BaseScraper):
    def scrape(self) -> ScrapedBrand:
        print(f"📦 Fetching sitemap from {self.brand_name}...")
        product_urls = self._discover_products()

        if not product_urls:
            print(f"  ✗ No product URLs found for {self.brand_name}")
            return ScrapedBrand(
                name=self.brand_name,
                slug=slugify(self.brand_name),
                country=self.country,
                website=self.base_url,
            )

        product_urls = product_urls[: self.max_products]
        print(f"  Found {len(product_urls)} products to scrape")

        perfumes: list[ScrapedPerfume] = []

        for url in product_urls:
            print(f"  🧪 {url}")
            perfume = self._scrape_product(url)
            if perfume:
                perfumes.append(perfume)
            self._wait()

        print(f"  ✓ Scraped {len(perfumes)} perfumes from {self.brand_name}")
        return ScrapedBrand(
            name=self.brand_name,
            slug=slugify(self.brand_name),
            country=self.country,
            website=self.base_url,
            perfumes=perfumes,
        )

    def _discover_products(self) -> list[str]:
        sitemap_xml = self._fetch(f"{self.base_url}/sitemap.xml")
        if not sitemap_xml:
            sitemap_xml = self._fetch(f"{self.base_url}/sitemaps.xml")
        if not sitemap_xml:
            return []

        soup = self._parse(sitemap_xml)
        urls = [loc.get_text(strip=True) for loc in soup.find_all("loc")]

        product_urls = []
        for url in urls:
            if "cdn." in url:
                continue
            if re.search(r"/p\d+", url):
                if "/en/" in url:
                    product_urls.append(url)

        if not product_urls:
            nested_sitemaps = [u for u in urls if u.endswith(".xml")]
            for sitemap_url in nested_sitemaps:
                nested = self._fetch(sitemap_url)
                if not nested:
                    continue
                nested_soup = self._parse(nested)
                for loc in nested_soup.find_all("loc"):
                    loc_url = loc.get_text(strip=True)
                    if "cdn." in loc_url:
                        continue
                    if re.search(r"/p\d+", loc_url) and "/en/" in loc_url:
                        product_urls.append(loc_url)
                self._wait()

        return list(dict.fromkeys(product_urls))

    def _scrape_product(self, url: str) -> ScrapedPerfume | None:
        html = self._fetch(url)
        if not html:
            return None

        soup = self._parse(html)

        jsonld_data = self._extract_jsonld(soup)
        name = jsonld_data.get("name") or self._extract_title(soup)
        if not name:
            return None

        description = jsonld_data.get("description", "")
        if description:
            description = re.sub(r"\s+", " ", description).strip()

        price = None
        currency = "SAR"
        offers = jsonld_data.get("offers", {})
        if isinstance(offers, dict):
            price_str = offers.get("price", "")
            try:
                price = float(price_str)
            except (ValueError, TypeError):
                pass
            currency = offers.get("priceCurrency", currency)

        image_url = None
        img = jsonld_data.get("image")
        if isinstance(img, str):
            image_url = img
        elif isinstance(img, list) and img:
            image_url = img[0]

        combined_text = f"{name} {description[:200]}"
        gender = detect_gender(combined_text)
        concentration = detect_concentration(combined_text)
        family = detect_family([], description[:300])

        notes = self._parse_arabic_notes(soup)

        return ScrapedPerfume(
            name=name.strip(),
            slug=slugify(f"{self.brand_name}-{name}"),
            brand_name=self.brand_name,
            description=description[:500] if description else None,
            gender=gender,
            concentration=concentration,
            family=family,
            price=price,
            currency=currency,
            image_url=image_url,
            source_url=url,
            notes=notes,
        )

    def _extract_jsonld(self, soup: BeautifulSoup) -> dict:
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and item.get("@type") in (
                            "Product",
                            "ProductGroup",
                        ):
                            return item
                elif isinstance(data, dict) and data.get("@type") in (
                    "Product",
                    "ProductGroup",
                ):
                    return data
            except (json.JSONDecodeError, TypeError):
                continue
        return {}

    def _extract_title(self, soup: BeautifulSoup) -> str | None:
        h1 = soup.find("h1")
        return h1.get_text(strip=True) if h1 else None

    def _parse_arabic_notes(self, soup: BeautifulSoup) -> list[ScrapedNote]:
        notes: list[ScrapedNote] = []

        for element in soup.find_all(["h2", "h3", "h4", "h5", "strong", "b", "label", "span", "p", "div"]):
            text = element.get_text(strip=True)
            layer = None

            for arabic_key, layer_val in ARABIC_NOTE_LAYERS.items():
                if arabic_key in text:
                    layer = layer_val
                    break

            if not layer:
                continue

            sibling = element.find_next_sibling()
            if sibling:
                note_names = self._extract_items(sibling)
                for name in note_names:
                    clean = name.strip().strip("،,")
                    if clean and len(clean) < 50:
                        notes.append(ScrapedNote(name=clean, layer=layer))

        if not notes:
            notes = self._parse_notes_table(soup)

        return self._dedupe_notes(notes)

    def _parse_notes_table(self, soup: BeautifulSoup) -> list[ScrapedNote]:
        notes: list[ScrapedNote] = []
        for row in soup.find_all("tr"):
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue
            label = cells[0].get_text(strip=True)
            for arabic_key, layer in ARABIC_NOTE_LAYERS.items():
                if arabic_key in label:
                    value = cells[1].get_text(strip=True)
                    for name in re.split(r"[,،]", value):
                        clean = name.strip()
                        if clean:
                            notes.append(ScrapedNote(name=clean, layer=layer))
                    break
        return notes

    def _extract_items(self, element) -> list[str]:
        items = element.find_all("li")
        if items:
            return [li.get_text(strip=True) for li in items if li.get_text(strip=True)]
        text = element.get_text(strip=True)
        parts = re.split(r"[,،/]", text)
        return [p.strip() for p in parts if p.strip()]

    def _dedupe_notes(self, notes: list[ScrapedNote]) -> list[ScrapedNote]:
        seen: set[str] = set()
        result: list[ScrapedNote] = []
        for n in notes:
            key = f"{n.name.lower()}:{n.layer}"
            if key not in seen:
                seen.add(key)
                result.append(n)
        return result
