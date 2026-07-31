import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    perfume: { findMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "@/server/db/client";
import { searchPerfumes } from "@/server/repositories/search";

const queryRaw = vi.mocked(prisma.$queryRaw);
const findMany = vi.mocked(prisma.perfume.findMany);

const now = new Date();
const row = {
  id: 7,
  brandId: 1,
  name: "Nomad",
  slug: "armaf-nomad-pour-homme",
  releaseYear: null,
  perfumer: null,
  gender: "male" as const,
  concentration: "edp" as const,
  fragranceFamily: "woody" as const,
  description: null,
  image: null,
  embedding: null,
  createdAt: now,
  updatedAt: now,
  brand: {
    id: 1,
    name: "Armaf",
    slug: "armaf",
    country: "UAE",
    foundedYear: null,
    logo: null,
    description: null,
    type: "arabic" as const,
    createdAt: now,
    updatedAt: now,
  },
  notes: [],
};

describe("searchPerfumes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects queries shorter than the minimum length", async () => {
    await expect(searchPerfumes("a")).resolves.toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("rejects queries over the max length", async () => {
    await expect(searchPerfumes("x".repeat(201))).resolves.toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("returns mapped results in rank order", async () => {
    queryRaw.mockResolvedValue([{ slug: "armaf-nomad-pour-homme" }]);
    findMany.mockResolvedValue([row]);
    const result = await searchPerfumes("nomad");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("armaf-nomad-pour-homme");
  });

  it("degrades to empty on error", async () => {
    queryRaw.mockRejectedValue(new Error("boom"));
    await expect(searchPerfumes("nomad")).resolves.toEqual([]);
  });
});
