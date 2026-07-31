import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    perfume: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "@/server/db/client";
import { getAlternatives } from "@/server/repositories/alternatives";

const queryRaw = vi.mocked(prisma.$queryRaw);
const findMany = vi.mocked(prisma.perfume.findMany);

const now = new Date();
const oudNote = { id: 1, name: "Oud", slug: "oud", createdAt: now };
const roseNote = { id: 2, name: "Rose", slug: "rose", createdAt: now };
const amberNote = { id: 3, name: "Amber", slug: "amber", createdAt: now };

const target = {
  id: 1,
  brandId: 1,
  name: "Original",
  slug: "original",
  releaseYear: null,
  perfumer: null,
  gender: "unisex" as const,
  concentration: "edp" as const,
  fragranceFamily: "woody" as const,
  description: null,
  image: null,
  embedding: null,
  createdAt: now,
  updatedAt: now,
  brand: { id: 1, name: "HouseA", slug: "housea", country: null, foundedYear: null, logo: null, description: null, type: "designer" as const, createdAt: now, updatedAt: now },
  notes: [
    { perfumeId: 1, noteId: 1, layer: "base" as const, note: oudNote },
    { perfumeId: 1, noteId: 2, layer: "heart" as const, note: roseNote },
  ],
};

const candidate = {
  ...target,
  id: 2,
  slug: "candidate",
  name: "Candidate",
  brand: { ...target.brand, name: "HouseB", slug: "houseb" },
  notes: [
    { perfumeId: 2, noteId: 1, layer: "base" as const, note: oudNote },
    { perfumeId: 2, noteId: 3, layer: "base" as const, note: amberNote },
  ],
};

describe("getAlternatives", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scores and ranks candidates sharing notes with the target", async () => {
    queryRaw.mockResolvedValue([{ id: 2 }]);
    findMany.mockResolvedValue([target, candidate]);
    const result = await getAlternatives(1);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("candidate");
    expect(result[0].score).toBeGreaterThan(0);
    expect(result[0].sharedNotes.map((n) => n.name)).toContain("Oud");
  });

  it("returns an empty list when there are no candidates", async () => {
    queryRaw.mockResolvedValue([]);
    await expect(getAlternatives(1)).resolves.toEqual([]);
  });

  it("degrades to empty on error", async () => {
    queryRaw.mockRejectedValue(new Error("boom"));
    await expect(getAlternatives(1)).resolves.toEqual([]);
  });
});
