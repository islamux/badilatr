import { describe, expect, it } from "vitest";

import { computeSimilarityScore } from "@/lib/similarity";

describe("computeSimilarityScore", () => {
  it("returns 100 when both pyramids are identical", () => {
    const a = { top: ["Bergamot", "Lemon"], heart: ["Rose"], base: ["Amber"] };
    const result = computeSimilarityScore(a, a);
    expect(result.score).toBe(100);
    expect(result.shared).toHaveLength(4);
    expect(result.shared.every((s) => s.sameLayer)).toBe(true);
  });

  it("returns 0 when no notes are shared", () => {
    const a = { top: ["Bergamot"], heart: ["Rose"], base: ["Amber"] };
    const b = { top: ["Pepper"], heart: ["Violet"], base: ["Oak"] };
    expect(computeSimilarityScore(a, b).score).toBe(0);
  });

  it("scores same-layer matches higher than cross-layer", () => {
    const base = { top: ["Bergamot", "Lemon", "Pepper"], heart: ["Rose", "Jasmine"], base: ["Amber", "Musk"] };
    const sameLayer = computeSimilarityScore(base, base);
    const crossLayer = computeSimilarityScore(base, {
      top: ["Amber", "Musk"],
      heart: ["Bergamot", "Lemon"],
      base: ["Rose", "Jasmine", "Pepper"],
    });
    expect(sameLayer.score).toBeGreaterThan(crossLayer.score);
    expect(sameLayer.score).toBe(100);
  });

  it("is case-insensitive", () => {
    const a = { top: ["Bergamot"], heart: [], base: [] };
    const b = { top: ["BERGAMOT"], heart: [], base: [] };
    const result = computeSimilarityScore(a, b);
    expect(result.score).toBe(100);
    expect(result.shared[0].name).toBe("Bergamot");
  });

  it("penalizes when one pyramid has far more notes", () => {
    const small = { top: ["Bergamot"], heart: ["Rose"], base: ["Amber"] };
    const large = {
      top: ["Bergamot", "Lemon", "Pepper", "Grapefruit", "Mint"],
      heart: ["Rose", "Jasmine", "Lavender", "Cinnamon"],
      base: ["Amber", "Musk", "Vanilla", "Sandalwood", "Patchouli"],
    };
    const result = computeSimilarityScore(small, large);
    expect(result.score).toBeLessThan(50);
    expect(result.score).toBeGreaterThan(0);
    expect(result.shared).toHaveLength(3);
  });

  it("lists shared note names with sameLayer flag", () => {
    const a = { top: ["Bergamot", "Lemon"], heart: ["Rose"], base: ["Amber"] };
    const b = { top: ["Bergamot"], heart: ["Rose"], base: ["Vanilla"] };
    const { shared } = computeSimilarityScore(a, b);
    const names = shared.map((s) => s.name);
    expect(names).toContain("Bergamot");
    expect(names).toContain("Rose");
    expect(names).not.toContain("Amber");
    expect(shared.find((s) => s.name === "Bergamot")?.sameLayer).toBe(true);
  });

  it("handles empty pyramids", () => {
    const empty = { top: [], heart: [], base: [] };
    expect(computeSimilarityScore(empty, empty).score).toBe(0);
    expect(computeSimilarityScore(empty, { top: ["X"], heart: [], base: [] }).score).toBe(0);
  });

  it("reports notes only in the original or only in the alternative", () => {
    const a = { top: ["Bergamot", "Lemon"], heart: ["Rose"], base: ["Amber", "Musk"] };
    const b = { top: ["Bergamot"], heart: ["Violet"], base: ["Amber", "Vanilla"] };
    const result = computeSimilarityScore(a, b);
    expect(result.onlyOriginal).toEqual(expect.arrayContaining(["Lemon", "Rose", "Musk"]));
    expect(result.onlyAlternative).toEqual(expect.arrayContaining(["Violet", "Vanilla"]));
    expect(result.onlyOriginal).not.toContain("Bergamot");
    expect(result.onlyAlternative).not.toContain("Amber");
  });

  it("lists all notes as differences when pyramids are disjoint", () => {
    const a = { top: ["Bergamot"], heart: ["Rose"], base: ["Amber"] };
    const b = { top: ["Pepper"], heart: ["Violet"], base: ["Oak"] };
    const result = computeSimilarityScore(a, b);
    expect(result.score).toBe(0);
    expect(result.onlyOriginal).toEqual(expect.arrayContaining(["Bergamot", "Rose", "Amber"]));
    expect(result.onlyAlternative).toEqual(expect.arrayContaining(["Pepper", "Violet", "Oak"]));
  });

  it("preserves original casing in difference lists", () => {
    const a = { top: ["BERGAMOT"], heart: [], base: [] };
    const b = { top: ["Lemon"], heart: [], base: [] };
    const result = computeSimilarityScore(a, b);
    expect(result.onlyOriginal).toContain("BERGAMOT");
    expect(result.onlyAlternative).toContain("Lemon");
  });

  it("leaves difference lists empty for identical pyramids", () => {
    const a = { top: ["Bergamot"], heart: ["Rose"], base: ["Amber"] };
    const result = computeSimilarityScore(a, a);
    expect(result.onlyOriginal).toEqual([]);
    expect(result.onlyAlternative).toEqual([]);
  });
});
