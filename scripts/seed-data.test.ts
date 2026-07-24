import { describe, expect, it } from "vitest";

import {
  seedBrands,
  seedNotes,
  seedPerfumes,
  type NoteLayer,
} from "./seed-data";

const VALID_LAYERS: NoteLayer[] = ["top", "heart", "base"];

describe("seedBrands", () => {
  it("has at least 8 brands", () => {
    expect(seedBrands.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique slugs", () => {
    const slugs = seedBrands.map((b) => b.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all brands are type 'arabic' in phase 1", () => {
    for (const brand of seedBrands) {
      expect(brand.type).toBe("arabic");
    }
  });

  it("all brands have non-empty names and descriptions", () => {
    for (const brand of seedBrands) {
      expect(brand.name.length).toBeGreaterThan(0);
      expect(brand.description.length).toBeGreaterThan(10);
    }
  });
});

describe("seedNotes", () => {
  it("has at least 20 notes", () => {
    expect(seedNotes.length).toBeGreaterThanOrEqual(20);
  });

  it("has unique slugs", () => {
    const slugs = seedNotes.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("seedPerfumes", () => {
  it("has at least 8 perfumes", () => {
    expect(seedPerfumes.length).toBeGreaterThanOrEqual(8);
  });

  it("has unique slugs", () => {
    const slugs = seedPerfumes.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every perfume references a valid brand slug", () => {
    const brandSlugs = new Set(seedBrands.map((b) => b.slug));
    for (const perfume of seedPerfumes) {
      expect(brandSlugs).toContain(perfume.brandSlug);
    }
  });

  it("every perfume has at least 3 notes", () => {
    for (const perfume of seedPerfumes) {
      expect(perfume.notes.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every note reference resolves to a defined note", () => {
    const noteSlugs = new Set(seedNotes.map((n) => n.slug));
    for (const perfume of seedPerfumes) {
      for (const note of perfume.notes) {
        expect(noteSlugs).toContain(note.slug);
      }
    }
  });

  it("every note layer is a valid enum value", () => {
    for (const perfume of seedPerfumes) {
      for (const note of perfume.notes) {
        expect(VALID_LAYERS).toContain(note.layer);
      }
    }
  });

  it("every perfume has at least one top and one base note", () => {
    for (const perfume of seedPerfumes) {
      const layers = perfume.notes.map((n) => n.layer);
      expect(layers).toContain("top");
      expect(layers).toContain("base");
    }
  });
});
