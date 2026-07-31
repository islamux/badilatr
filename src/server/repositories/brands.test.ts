import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    brand: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/db/client";
import {
  getAllBrands,
  getBrandBySlug,
  getBrandSlugs,
} from "@/server/repositories/brands";

const findMany = vi.mocked(prisma.brand.findMany);
const findUnique = vi.mocked(prisma.brand.findUnique);

const now = new Date();
const brandRow = {
  id: 1,
  name: "Armaf",
  slug: "armaf",
  country: "UAE",
  foundedYear: 2000,
  logo: null,
  description: "A house",
  type: "arabic" as const,
  createdAt: now,
  updatedAt: now,
  _count: { perfumes: 3 },
};

describe("getAllBrands", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps brands with their perfume counts", async () => {
    findMany.mockResolvedValue([brandRow]);
    const result = await getAllBrands();
    expect(result).toHaveLength(1);
    expect(result[0].perfumeCount).toBe(3);
    expect(result[0].slug).toBe("armaf");
  });

  it("returns an empty list on error", async () => {
    findMany.mockRejectedValue(new Error("boom"));
    await expect(getAllBrands()).resolves.toEqual([]);
  });
});

describe("getBrandSlugs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns just the slugs", async () => {
    findMany.mockResolvedValue([{ slug: "armaf" }, { slug: "afnan" }]);
    const result = await getBrandSlugs();
    expect(result).toEqual(["armaf", "afnan"]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: { slug: true } }),
    );
  });

  it("returns an empty list on error", async () => {
    findMany.mockRejectedValue(new Error("boom"));
    await expect(getBrandSlugs()).resolves.toEqual([]);
  });
});

describe("getBrandBySlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a mapped brand when found", async () => {
    findUnique.mockResolvedValue(brandRow);
    const result = await getBrandBySlug("armaf");
    expect(result?.name).toBe("Armaf");
    expect(result?.foundedYear).toBe(2000);
  });

  it("returns null when missing", async () => {
    findUnique.mockResolvedValue(null);
    await expect(getBrandBySlug("nope")).resolves.toBeNull();
  });

  it("returns null on error", async () => {
    findUnique.mockRejectedValue(new Error("boom"));
    await expect(getBrandBySlug("armaf")).resolves.toBeNull();
  });
});
