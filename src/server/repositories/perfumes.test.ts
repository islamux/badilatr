import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    perfume: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { prisma } from "@/server/db/client";
import {
  getLandingPerfumes,
  getPerfumeBySlug,
  getPerfumeSlugs,
  getPerfumesByBrandSlug,
  getPerfumesPage,
  mapPerfume,
} from "@/server/repositories/perfumes";

const now = new Date();

const brand = {
  id: 1,
  name: "TestHouse",
  slug: "testhouse",
  country: "UAE",
  foundedYear: 2000,
  logo: null,
  description: null,
  type: "designer" as const,
  createdAt: now,
  updatedAt: now,
};

const oudNote = { id: 1, name: "Oud", slug: "oud", createdAt: now };
const roseNote = { id: 2, name: "Rose", slug: "rose", createdAt: now };

const row = {
  id: 1,
  brandId: 1,
  name: "Test Oud",
  slug: "test-oud",
  releaseYear: 2020,
  perfumer: "Someone",
  gender: "unisex" as const,
  concentration: "edp" as const,
  fragranceFamily: "woody" as const,
  description: "A test scent",
  image: "https://example.com/x.jpg",
  embedding: null,
  createdAt: now,
  updatedAt: now,
  brand,
  notes: [
    { perfumeId: 1, noteId: 1, layer: "base" as const, note: oudNote },
    { perfumeId: 1, noteId: 2, layer: "heart" as const, note: roseNote },
  ],
};

const findMany = vi.mocked(prisma.perfume.findMany);
const count = vi.mocked(prisma.perfume.count);
const findFirst = vi.mocked(prisma.perfume.findFirst);

describe("mapPerfume", () => {
  it("maps a full perfume row", () => {
    const mapped = mapPerfume(row);
    expect(mapped.slug).toBe("test-oud");
    expect(mapped.brand).toBe("TestHouse");
    expect(mapped.family).toBe("woody");
    expect(mapped.notes).toHaveLength(2);
    expect(mapped.price).toBeNull();
  });
});

describe("getLandingPerfumes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mapped perfumes and caps the query", async () => {
    findMany.mockResolvedValue([row]);
    const result = await getLandingPerfumes();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Oud");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 12, orderBy: { id: "asc" } }),
    );
  });

  it("returns an empty list on DB error", async () => {
    findMany.mockRejectedValue(new Error("boom"));
    await expect(getLandingPerfumes()).resolves.toEqual([]);
  });
});

describe("getPerfumesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clamps page/pageSize and computes pagination", async () => {
    findMany.mockResolvedValue([row]);
    count.mockResolvedValue(50);
    const result = await getPerfumesPage(2, 24);
    expect(result.total).toBe(50);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(24);
    expect(result.items).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 24, skip: 24 }),
    );
  });

  it("clamps invalid inputs", async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);
    const result = await getPerfumesPage(-3, 999);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(60);
  });

  it("degrades to empty on error", async () => {
    findMany.mockRejectedValue(new Error("boom"));
    count.mockResolvedValue(0);
    const result = await getPerfumesPage(1, 24);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("getPerfumeBySlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a mapped detail when found", async () => {
    findFirst.mockResolvedValue(row);
    const result = await getPerfumeBySlug("test-oud");
    expect(result?.name).toBe("Test Oud");
    expect(result?.brand.slug).toBe("testhouse");
  });

  it("returns null when missing", async () => {
    findFirst.mockResolvedValue(null);
    await expect(getPerfumeBySlug("nope")).resolves.toBeNull();
  });

  it("returns null on error", async () => {
    findFirst.mockRejectedValue(new Error("boom"));
    await expect(getPerfumeBySlug("test-oud")).resolves.toBeNull();
  });
});

describe("getPerfumesByBrandSlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes the query to the brand relation", async () => {
    findMany.mockResolvedValue([row]);
    const result = await getPerfumesByBrandSlug("testhouse");
    expect(result).toHaveLength(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { brand: { slug: "testhouse" } } }),
    );
  });

  it("returns an empty list on error", async () => {
    findMany.mockRejectedValue(new Error("boom"));
    await expect(getPerfumesByBrandSlug("testhouse")).resolves.toEqual([]);
  });
});

describe("getPerfumeSlugs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns just the slugs", async () => {
    findMany.mockResolvedValue([{ slug: "a" }, { slug: "b" }]);
    await expect(getPerfumeSlugs()).resolves.toEqual(["a", "b"]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: { slug: true } }),
    );
  });

  it("returns an empty list on error", async () => {
    findMany.mockRejectedValue(new Error("boom"));
    await expect(getPerfumeSlugs()).resolves.toEqual([]);
  });
});
