from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field


def slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[\s_-]+", "-", s)


NoteLayer = Literal["top", "heart", "base"]
Gender = Literal["male", "female", "unisex"]
Concentration = Literal["edt", "edp", "parfum", "extrait"]
FragranceFamily = Literal["woody", "oriental", "fresh", "floral", "gourmand"]


class ScrapedNote(BaseModel):
    name: str
    layer: NoteLayer


class ScrapedPerfume(BaseModel):
    name: str
    slug: str
    brand_name: str
    description: str | None = None
    gender: Gender | None = None
    concentration: Concentration | None = None
    family: FragranceFamily | None = None
    price: float | None = None
    currency: str | None = None
    image_url: str | None = None
    source_url: str
    notes: list[ScrapedNote] = Field(default_factory=list)


class ScrapedBrand(BaseModel):
    name: str
    slug: str
    country: str | None = None
    website: str
    perfumes: list[ScrapedPerfume] = Field(default_factory=list)


GENDER_KEYWORDS: dict[str, Gender] = {
    "men": "male",
    "man": "male",
    "him": "male",
    "pour homme": "male",
    "for men": "male",
    "women": "female",
    "woman": "female",
    "her": "female",
    "pour femme": "female",
    "for women": "female",
    "unisex": "unisex",
}

CONCENTRATION_KEYWORDS: dict[str, Concentration] = {
    "edt": "edt",
    "eau de toilette": "edt",
    "edp": "edp",
    "eau de parfum": "edp",
    "parfum": "parfum",
    "extrait": "extrait",
    "intense": "edp",
}

FAMILY_KEYWORDS: dict[str, FragranceFamily] = {
    "woody": "woody",
    "oriental": "oriental",
    "amber": "oriental",
    "oud": "oriental",
    "fresh": "fresh",
    "aquatic": "fresh",
    "citrus": "fresh",
    "floral": "floral",
    "rose": "floral",
    "jasmine": "floral",
    "gourmand": "gourmand",
    "vanilla": "gourmand",
    "sweet": "gourmand",
}


def detect_gender(text: str) -> Gender | None:
    lower = text.lower()
    for keyword, gender in GENDER_KEYWORDS.items():
        if keyword in lower:
            return gender
    return None


def detect_concentration(text: str) -> Concentration | None:
    lower = text.lower()
    for keyword, conc in CONCENTRATION_KEYWORDS.items():
        if keyword in lower:
            return conc
    return None


def detect_family(tags: list[str], description: str) -> FragranceFamily | None:
    combined = " ".join(tags).lower() + " " + description.lower()
    for keyword, family in FAMILY_KEYWORDS.items():
        if keyword in combined:
            return family
    return None
