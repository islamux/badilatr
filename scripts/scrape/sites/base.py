from __future__ import annotations

import time
from abc import ABC, abstractmethod

import httpx
from bs4 import BeautifulSoup

from models import ScrapedBrand

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
}


class BaseScraper(ABC):
    def __init__(
        self,
        base_url: str,
        brand_name: str,
        country: str | None = None,
        delay: float = 3.0,
        max_products: int = 5,
    ):
        self.base_url = base_url.rstrip("/")
        self.brand_name = brand_name
        self.country = country
        self.delay = delay
        self.max_products = max_products
        self._client = httpx.Client(
            headers=HEADERS,
            timeout=httpx.Timeout(20.0, connect=10.0),
            follow_redirects=True,
        )

    def _fetch(self, url: str) -> str | None:
        for attempt in range(3):
            try:
                resp = self._client.get(url)
                if resp.status_code == 200:
                    return resp.text
                if resp.status_code in (429, 503):
                    wait = self.delay * (attempt + 1) * 2
                    print(f"  ⏳ {resp.status_code} — backing off {wait:.0f}s")
                    time.sleep(wait)
                    continue
                print(f"  ✗ {resp.status_code} for {url}")
                return None
            except httpx.HTTPError as e:
                wait = self.delay * (attempt + 1)
                print(f"  ⚠ {e} — retry in {wait:.0f}s")
                time.sleep(wait)
        return None

    def _fetch_json(self, url: str) -> dict | list | None:
        for attempt in range(3):
            try:
                resp = self._client.get(url)
                if resp.status_code == 200:
                    return resp.json()
                if resp.status_code in (429, 503):
                    wait = self.delay * (attempt + 1) * 2
                    print(f"  ⏳ {resp.status_code} — backing off {wait:.0f}s")
                    time.sleep(wait)
                    continue
                print(f"  ✗ {resp.status_code} for {url}")
                return None
            except (httpx.HTTPError, ValueError) as e:
                wait = self.delay * (attempt + 1)
                print(f"  ⚠ {e} — retry in {wait:.0f}s")
                time.sleep(wait)
        return None

    def _wait(self):
        time.sleep(self.delay)

    def _parse(self, html: str) -> BeautifulSoup:
        return BeautifulSoup(html, "lxml")

    @abstractmethod
    def scrape(self) -> ScrapedBrand:
        ...

    def close(self):
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
