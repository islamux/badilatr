"""
Base Playwright Scraper
=======================
Shared lifecycle for the Playwright-based scrapers (Fragrantica, Basenotes,
Notino). Subclasses provide the source-specific search/extract logic and
configure behaviour via class attributes.
"""

import os
import json
import time
import random
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
)
VIEWPORT = {"width": 1920, "height": 1080}


class BasePlaywrightScraper:
    SOURCE = None
    OUTPUT_FILENAME = None
    RECORDS_KEY = "perfumes"
    LOCALE = "en-US"
    DELAY_MIN = 3.0
    DELAY_MAX = 6.0
    DEFAULT_MAX = 300

    def __init__(self, output_dir=None, max_items=None, headless=True):
        self.output_dir = output_dir or OUTPUT_DIR
        os.makedirs(self.output_dir, exist_ok=True)
        self.max_items = max_items if max_items is not None else self.DEFAULT_MAX
        self.headless = headless
        self.collected = 0
        self.seen = set()
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    def _init_browser(self):
        """Start a fresh Playwright browser session."""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=self.headless)
        self.context = self.browser.new_context(
            user_agent=USER_AGENT,
            viewport=VIEWPORT,
            locale=self.LOCALE,
        )
        self.page = self.context.new_page()

    def _close_browser(self):
        """Stop the Playwright session, tolerating errors during teardown."""
        if self.browser:
            try:
                self.browser.close()
            except Exception:
                pass
        if self.playwright:
            try:
                self.playwright.stop()
            except Exception:
                pass
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    def _random_delay(self, min_d=None, max_d=None):
        """Sleep a random duration between requests to avoid rate limits."""
        time.sleep(random.uniform(min_d or self.DELAY_MIN, max_d or self.DELAY_MAX))

    def _save_results(self, records, extra=None):
        """Write the standard {source, scraped_at, total_count, <records>} envelope."""
        payload = {
            "source": self.SOURCE,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "total_count": len(records),
            self.RECORDS_KEY: records,
        }
        if extra:
            payload.update(extra)

        output_file = os.path.join(self.output_dir, self.OUTPUT_FILENAME)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        print(f"\n  [SAVE] Data saved to: {output_file}")
        print(f"  [SAVE] Total records: {len(records)}")

    @staticmethod
    def _section(title, *lines):
        """Print a banner framed with separator lines."""
        print(f"\n{'=' * 60}")
        print(title)
        for line in lines:
            print(line)
        print(f"{'=' * 60}\n")
