from __future__ import annotations

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


class ShopifyScraper(BaseScraper):
    def scrape(self) -> ScrapedBrand:
        print(f"📦 Fetching product list from {self.brand_name}...")
        data = self._fetch_json(f"{self.base_url}/products.json?limit=250")
        if not data or "products" not in data:
            print(f"  ✗ No products found for {self.brand_name}")
            return ScrapedBrand(
                name=self.brand_name,
                slug=slugify(self.brand_name),
                country=self.country,
                website=self.base_url,
            )

        products = data["products"]
        products = [
            p
            for p in products
            if not any(
                kw in p.get("title", "").lower()
                for kw in ("kit", "gift set", "discovery", "set")
            )
        ]
        products = products[: self.max_products]
        perfumes: list[ScrapedPerfume] = []

        for product in products:
            handle = product.get("handle", "")
            title = product.get("title", "").strip()
            if not title or not handle:
                continue

            print(f"  🧪 {title}")
            source_url = f"{self.base_url}/products/{handle}"

            description_html = product.get("body_html", "")
            description = self._strip_html(description_html)

            raw_tags = product.get("tags", "")
            if isinstance(raw_tags, list):
                tags = [t.strip() for t in raw_tags if t.strip()]
            else:
                tags = [t.strip() for t in str(raw_tags).split(",") if t.strip()]
            combined_text = f"{title} {' '.join(tags)} {description[:200]}"

            gender = detect_gender(combined_text)
            concentration = detect_concentration(combined_text)
            family = detect_family(tags, description[:300])

            price = None
            currency = None
            variants = product.get("variants", [])
            if variants:
                price_str = variants[0].get("price", "")
                try:
                    price = float(price_str)
                except (ValueError, TypeError):
                    pass
                currency = variants[0].get("price", "") and None

            image_url = None
            images = product.get("images", [])
            if images:
                image_url = images[0].get("src")

            notes = self._fetch_notes(source_url)

            perfume = ScrapedPerfume(
                name=title,
                slug=slugify(f"{self.brand_name}-{title}"),
                brand_name=self.brand_name,
                description=description[:500] if description else None,
                gender=gender,
                concentration=concentration,
                family=family,
                price=price,
                currency="AED",
                image_url=image_url,
                source_url=source_url,
                notes=notes,
            )
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

    def _fetch_notes(self, pdp_url: str) -> list[ScrapedNote]:
        html = self._fetch(pdp_url)
        if not html:
            return []
        soup = self._parse(html)
        return self._parse_notes(soup)

    def _parse_notes(self, soup: BeautifulSoup) -> list[ScrapedNote]:
        notes: list[ScrapedNote] = []
        layer_map = {
            "top": "top",
            "top notes": "top",
            "head": "top",
            "opening": "top",
            "opening notes": "top",
            "middle": "heart",
            "middle notes": "heart",
            "heart": "heart",
            "heart notes": "heart",
            "base": "base",
            "base notes": "base",
            "dry-down": "base",
            "dry-down notes": "base",
            "dry down": "base",
        }

        for heading in soup.find_all(["h2", "h3", "h4", "strong", "b"]):
            text = heading.get_text(strip=True).lower()
            if "note" not in text and "opening" not in text and "dry" not in text:
                continue

            layer = None
            for key, val in layer_map.items():
                if key in text:
                    layer = val
                    break

            if not layer:
                continue

            sibling = heading.find_next_sibling()
            if sibling:
                note_names = self._extract_note_names(sibling)
                for name in note_names:
                    clean = name.strip()
                    if clean and len(clean) < 50:
                        notes.append(ScrapedNote(name=clean, layer=layer))

        return self._dedupe_notes(notes)

    def _extract_note_names(self, element) -> list[str]:
        child_divs = element.find_all("div", recursive=False)
        if child_divs:
            names = [d.get_text(strip=True) for d in child_divs if d.get_text(strip=True)]
            if names:
                return names

        all_divs = element.find_all("div")
        if len(all_divs) > 1:
            names = [d.get_text(strip=True) for d in all_divs if d.get_text(strip=True) and len(d.get_text(strip=True)) < 40]
            if names:
                return names

        items = element.find_all("li")
        if items:
            return [li.get_text(strip=True) for li in items if li.get_text(strip=True)]

        spans = element.find_all("span")
        if spans:
            return [s.get_text(strip=True) for s in spans if s.get_text(strip=True)]

        text = element.get_text(strip=True)
        if "," in text:
            return [n.strip() for n in text.split(",") if n.strip()]
        if len(text) > 15 and text[0].isupper():
            import re
            parts = re.findall(r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?", text)
            if len(parts) > 1:
                return parts
        return [text] if text and len(text) < 50 else []

    def _dedupe_notes(self, notes: list[ScrapedNote]) -> list[ScrapedNote]:
        seen: set[str] = set()
        result: list[ScrapedNote] = []
        for n in notes:
            key = f"{n.name.lower()}:{n.layer}"
            if key not in seen:
                seen.add(key)
                result.append(n)
        return result

    def _strip_html(self, html: str) -> str:
        if not html:
            return ""
        soup = BeautifulSoup(html, "lxml")
        return re.sub(r"\s+", " ", soup.get_text()).strip()
