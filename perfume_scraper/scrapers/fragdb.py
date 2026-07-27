"""
FragDB Scraper - Comprehensive fragrance database
=================================================
Downloads free sample CSV files from FragDB GitHub repository
and converts them to structured JSON format.

FragDB provides:
- 135,308+ fragrances with notes, accords, ratings
- 8,093 brands with profiles
- 2,573 notes with multilingual translations
- 23 language translations
- Data refreshed: 2026-07-20

Source: https://github.com/FragDB/fragrance-database
License: CC-BY-NC-4.0

This scraper downloads the free 10-record samples.
For full data, purchase from fragdb.net ($200 Core / $400 Full).
"""

import json
import os
import csv
import io
import re
import requests
from datetime import datetime, timezone


# ─── Configuration ───────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")

GITHUB_RAW_BASE = "https://raw.githubusercontent.com/FragDB/fragrance-database/main"

CSV_FILES = {
    "fragrances": f"{GITHUB_RAW_BASE}/samples/fragrances.csv",
    "brands": f"{GITHUB_RAW_BASE}/samples/brands.csv",
    "perfumers": f"{GITHUB_RAW_BASE}/samples/perfumers.csv",
    "notes": f"{GITHUB_RAW_BASE}/samples/notes.csv",
    "accords": f"{GITHUB_RAW_BASE}/samples/accords.csv",
}


def download_csv(url):
    """Download a CSV file from GitHub raw URL."""
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 200:
            reader = csv.DictReader(io.StringIO(r.text), delimiter="|")
            return list(reader)
        else:
            print(f"  [WARN] {r.status_code} for {url}")
            return []
    except Exception as e:
        print(f"  [ERROR] Failed to download {url}: {e}")
        return []


def build_lookup_map(data, id_field="id"):
    """Build a lookup dictionary from a list of dicts by ID."""
    lookup = {}
    for row in data:
        row_id = row.get(id_field, "")
        if row_id:
            lookup[row_id] = row
    return lookup


def parse_notes_pyramid(pyramid_str, notes_map):
    """Parse notes pyramid string into structured data.
    Format: top(n2415,1.0,5.0;n146,0.96,3.67)middle(n42,0.85,3.05)base(n2260,0.85,3.05)
    
    Note: Pyramid IDs have 'n' prefix (e.g. n2415) but CSV IDs also have 'n' prefix.
    The free sample only has 10 notes, so most pyramid IDs won't match.
    We include the raw ID and try to match, falling back to raw ID as name.
    """
    if not pyramid_str:
        return {"top": [], "middle": [], "base": []}

    all_notes = {"top": [], "middle": [], "base": []}

    # Extract each layer
    for layer in ["top", "middle", "base"]:
        pattern = rf'{layer}\(([^)]*)\)'
        match = re.search(pattern, pyramid_str)
        if match:
            notes_str = match.group(1)
            for part in notes_str.split(";"):
                part = part.strip()
                if not part:
                    continue
                fields = part.split(",")
                note_id = fields[0].strip()  # e.g. "n2415"
                opacity = fields[1].strip() if len(fields) > 1 else None
                weight = fields[2].strip() if len(fields) > 2 else None

                # Try direct lookup first, then without 'n' prefix
                note_info = notes_map.get(note_id, {})
                if not note_info:
                    # Try stripping 'n' prefix (in case sample doesn't include this note)
                    numeric_id = note_id[1:] if note_id.startswith('n') else note_id
                    note_info = notes_map.get(f"n{numeric_id}", {})
                
                all_notes[layer].append({
                    "id": note_id,
                    "name": note_info.get("name", note_id),
                    "opacity": opacity,
                    "weight": weight,
                })

    return all_notes


def parse_accords(accords_str, accords_map):
    """Parse accords string into structured data.
    Format: a24:100;a91:75;a33:63
    """
    if not accords_str:
        return []

    accords = []
    for part in accords_str.split(";"):
        part = part.strip()
        if not part:
            continue
        fields = part.split(":")
        accord_id = fields[0].strip()
        intensity = int(fields[1]) if len(fields) > 1 else 0

        accord_info = accords_map.get(accord_id, {})
        accords.append({
            "id": accord_id,
            "name": accord_info.get("name", accord_id),
            "color": accord_info.get("color", None),
            "intensity": intensity,
        })
    return accords


def parse_vote_data(vote_str):
    """Parse vote string like 'like_love:11700:32.39;like_like:15000:41.67'
    Returns dict with counts and percentages.
    """
    if not vote_str:
        return {}

    result = {}
    for part in vote_str.split(";"):
        if ":" not in part:
            continue
        fields = part.split(":")
        if len(fields) >= 3:
            key = fields[0]
            count = int(fields[1])
            pct = float(fields[2])
            result[key] = {"count": count, "percentage": pct}

    return result


def vote_percentages(vote_str, prefix):
    """Parse a vote string then map each key to {stripped_name: percentage}.

    FragDB reuses the ``season_`` prefix for both the season and the
    time_of_day fields, so the prefix is passed in rather than assumed.
    """
    votes = parse_vote_data(vote_str)
    return {
        key.replace(prefix, ""): val["percentage"]
        for key, val in votes.items()
    }


def parse_rating(rating_str):
    """Parse rating string like '3.86;36106' -> average score and number of ratings."""
    if not rating_str:
        return None, 0
    parts = rating_str.split(";")
    avg_score = float(parts[0]) if parts[0] else None
    num_ratings = int(parts[1]) if len(parts) > 1 and parts[1] else 0
    return avg_score, num_ratings


def _parse_image_urls(photo_str, pid=""):
    """Parse the photo field which contains complex image URL patterns.
    Format: img1/img2/img3 or photogram URLs.
    Returns list of valid image URLs.
    """
    if not photo_str:
        # Fallback: construct thumbnail URL from PID
        if pid:
            return [
                f"https://fimgs.net/mdimg/perfume-thumbs/375x500.{pid}.jpg",
                f"https://fimgs.net/mdimg/perfume/375x500.{pid}.jpg",
            ]
        return []
    
    urls = []
    # Split by semicolons first
    parts = photo_str.split(";")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # If it starts with http, it's a full URL
        if part.startswith("http"):
            urls.append(part)
        # If it looks like a path (starts with / or contains /), try to build URL
        elif part.startswith("/") or ("/" in part and "." in part):
            # Try fimgs.net CDN pattern
            if "fimgs.net" in part:
                urls.append(f"https:{part}" if part.startswith("//") else part)
            else:
                urls.append(f"https://fimgs.net/{part}")
        elif part.startswith("//"):
            urls.append(f"https:{part}")
    
    # If no URLs found from parsing, construct from PID
    if not urls and pid:
        urls = [
            f"https://fimgs.net/mdimg/perfume-thumbs/375x500.{pid}.jpg",
            f"https://fimgs.net/mdimg/perfume/375x500.{pid}.jpg",
        ]
    
    return urls


def extract_description_text(html_str):
    """Extract plain text from HTML description."""
    if not html_str:
        return None
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', html_str)
    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Take first sentence or first 200 chars
    sentences = text.split('. ')
    return sentences[0] + '.' if sentences else text[:200]


def scrape_fragdb():
    """Download and convert FragDB sample data to JSON."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"FRAGDB SCRAPER - Starting")
    print(f"{'='*60}")
    print(f"Source: https://github.com/FragDB/fragrance-database")
    print(f"Data refreshed: 2026-07-20 (v5.10)")
    print(f"{'='*60}\n")

    # Download all CSV files
    data = {}
    for name, url in CSV_FILES.items():
        print(f"  [DOWNLOAD] {name}...")
        rows = download_csv(url)
        data[name] = rows
        print(f"    → {len(rows)} records")

    # Build lookup maps
    brands_map = build_lookup_map(data.get("brands", []))
    notes_map = build_lookup_map(data.get("notes", []))
    accords_map = build_lookup_map(data.get("accords", []))

    # Convert fragrances to structured JSON
    perfumes = []
    for frag in data.get("fragrances", []):
        # Parse brand field: "Brand Name;brand_id"
        brand_field = frag.get("brand", "")
        brand_parts = brand_field.split(";") if brand_field else []
        brand_name = brand_parts[0].strip() if brand_parts else None
        brand_id = brand_parts[1].strip() if len(brand_parts) > 1 else None

        # Get brand info
        brand_info = brands_map.get(brand_id, {}) if brand_id else {}

        # Parse notes pyramid (top/middle/base)
        notes = parse_notes_pyramid(frag.get("notes_pyramid", ""), notes_map)

        # Parse accords
        accords = parse_accords(frag.get("accords", ""), accords_map)

        # Parse perfumer field: "Olivier Cresp;p39"
        perfumer_field = frag.get("perfumers", "")
        perfumer_parts = perfumer_field.split(";") if perfumer_field else []
        perfumer_name = perfumer_parts[0].strip() if perfumer_parts else None
        perfumer_id = perfumer_parts[1].strip() if len(perfumer_parts) > 1 else None

        # Parse rating
        avg_score, num_ratings = parse_rating(frag.get("rating", ""))

        # Parse appreciation (love/like/ok/dislike/hate votes)
        appreciation = parse_vote_data(frag.get("appreciation", ""))
        votes = {
            "love": appreciation.get("like_love", {}).get("count", 0),
            "like": appreciation.get("like_like", {}).get("count", 0),
            "ok": appreciation.get("like_ok", {}).get("count", 0),
            "dislike": appreciation.get("like_dislike", {}).get("count", 0),
            "hate": appreciation.get("like_hate", {}).get("count", 0),
        }

        # Parse gender votes
        gender_votes = parse_vote_data(frag.get("gender_votes", ""))
        gender_data = {
            "label": frag.get("gender", ""),
            "distribution": gender_votes,
        }

        # Parse longevity
        longevity_votes = parse_vote_data(frag.get("longevity", ""))
        longevity_data = {
            "label": None,
            "distribution": longevity_votes,
        }
        # Find dominant longevity
        if longevity_votes:
            dominant = max(longevity_votes.items(), key=lambda x: x[1]["count"])
            longevity_data["label"] = dominant[0].replace("longevity_", "")

        # Parse sillage
        sillage_votes = parse_vote_data(frag.get("sillage", ""))
        sillage_data = {
            "label": None,
            "distribution": sillage_votes,
        }
        if sillage_votes:
            dominant = max(sillage_votes.items(), key=lambda x: x[1]["count"])
            sillage_data["label"] = dominant[0].replace("sillage_", "")

        # Parse season
        season_data = vote_percentages(frag.get("season", ""), "season_")

        # Parse time of day (FragDB prefixes these keys with "season_" too)
        time_data = vote_percentages(frag.get("time_of_day", ""), "season_")

        # Parse price value
        price_data = vote_percentages(frag.get("price_value", ""), "price_")

        # Parse pros/cons
        pros_cons = {"pros": [], "cons": []}
        pros_str = frag.get("pros_cons", "")
        if pros_str:
            pros_match = re.search(r'pros\(([^)]*)\)', pros_str)
            cons_match = re.search(r'cons\(([^)]*)\)', pros_str)
            if pros_match:
                for item in pros_match.group(1).split(";"):
                    parts = item.split(",")
                    if len(parts) >= 1:
                        pros_cons["pros"].append({
                            "text": parts[0],
                            "count": int(parts[1]) if len(parts) > 1 else 0,
                        })
            if cons_match:
                for item in cons_match.group(1).split(";"):
                    parts = item.split(",")
                    if len(parts) >= 1:
                        pros_cons["cons"].append({
                            "text": parts[0],
                            "count": int(parts[1]) if len(parts) > 1 else 0,
                        })

        # Build perfume record
        perfume = {
            "source": "fragdb",
            "pid": frag.get("pid", ""),
            "name": frag.get("name", ""),
            "brand": brand_name,
            "brand_id": brand_id,
            "brand_country": brand_info.get("country", None),
            "brand_logo": brand_info.get("logo", None),
            "brand_website": brand_info.get("website", None),
            "brand_parent_company": brand_info.get("parent_company", None),
            "perfumer": perfumer_name,
            "perfumer_id": perfumer_id,
            "year": int(frag["year"]) if frag.get("year") else None,
            "gender": gender_data,
            "description": extract_description_text(frag.get("description", "")),
            "rating": {
                "average": avg_score,
                "total_ratings": num_ratings,
                "votes": votes,
                "total_votes": sum(votes.values()),
            },
            "notes": notes,
            "accords": accords,
            "longevity": longevity_data,
            "sillage": sillage_data,
            "best_season": season_data,
            "best_time": time_data,
            "price_value": price_data,
            "reviews_count": int(frag.get("reviews_count", "0") or 0),
            "pros_cons": pros_cons,
            "image_urls": _parse_image_urls(frag.get("photo", ""), frag.get("pid", "")),
            "url": f"https://www.fragrantica.com/perfume/{brand_name.replace(' ', '-')}/{frag.get('slug', '')}.html",
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }
        perfumes.append(perfume)

    # Save results
    output_data = {
        "source": "fragdb",
        "source_url": "https://github.com/FragDB/fragrance-database",
        "license": "CC-BY-NC-4.0",
        "data_version": "v5.10",
        "data_refreshed": "2026-07-20",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "total_count": len(perfumes),
        "perfumes": perfumes,
        # Reference data
        "brands": data.get("brands", []),
        "notes": data.get("notes", []),
        "accords": data.get("accords", []),
        "perfumers": data.get("perfumers", []),
    }

    output_file = os.path.join(OUTPUT_DIR, "fragdb_data.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*60}")
    print(f"FRAGDB SCRAPER - Complete")
    print(f"Total perfumes: {len(perfumes)}")
    print(f"Reference data:")
    print(f"  Brands: {len(data.get('brands', []))}")
    print(f"  Notes: {len(data.get('notes', []))}")
    print(f"  Accords: {len(data.get('accords', []))}")
    print(f"  Perfumers: {len(data.get('perfumers', []))}")
    print(f"  [SAVE] Data saved to: {output_file}")
    print(f"{'='*60}")

    return perfumes, output_file


# ─── Direct Run ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    perfumes, output_file = scrape_fragdb()
    print(f"\nDone! Collected {len(perfumes)} perfumes.")
    print(f"Output: {output_file}")
