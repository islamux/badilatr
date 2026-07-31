import { unstable_cache } from "next/cache";

import type { StaticPerfume } from "@/data/perfumes";
import { Prisma } from "@prisma/client";
import type { PerfumeDetail } from "@/types/catalog";
import { logRepoError } from "@/lib/repo-utils";
import { prisma } from "@/server/db/client";

type PerfumeWithRelations = Prisma.PerfumeGetPayload<{
  include: { brand: true; notes: { include: { note: true } } };
}>;

const PERFUME_INCLUDE = {
  brand: true,
  notes: { include: { note: true } },
} as const;

const LANDING_TAKE = 12;
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

export function mapPerfume(p: PerfumeWithRelations): StaticPerfume {
  return {
    name: p.name,
    slug: p.slug,
    brand: p.brand.name,
    description: p.description,
    gender: p.gender,
    concentration: p.concentration,
    family: p.fragranceFamily,
    price: null,
    currency: null,
    image_url: p.image,
    notes: p.notes.map((pn) => ({ name: pn.note.name, layer: pn.layer })),
  };
}

export const getLandingPerfumes = unstable_cache(
  async (): Promise<StaticPerfume[]> => {
    try {
      const rows = await prisma.perfume.findMany({
        include: PERFUME_INCLUDE,
        orderBy: { id: "asc" },
        take: LANDING_TAKE,
      });
      return rows.map(mapPerfume);
    } catch (err) {
      logRepoError("getLandingPerfumes", err);
      return [];
    }
  },
  ["landing-perfumes"],
  { revalidate: 600, tags: ["perfumes"] },
);

export type PerfumesPage = {
  items: StaticPerfume[];
  total: number;
  page: number;
  pageSize: number;
};

export const getPerfumesPage = unstable_cache(
  async (page: number, pageSize: number): Promise<PerfumesPage> => {
    const safePage = Math.max(1, page);
    const safeSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    try {
      const [rows, total] = await Promise.all([
        prisma.perfume.findMany({
          include: PERFUME_INCLUDE,
          orderBy: { name: "asc" },
          take: safeSize,
          skip: (safePage - 1) * safeSize,
        }),
        prisma.perfume.count(),
      ]);
      return { items: rows.map(mapPerfume), total, page: safePage, pageSize: safeSize };
    } catch (err) {
      logRepoError("getPerfumesPage", err);
      return { items: [], total: 0, page: safePage, pageSize: safeSize };
    }
  },
  ["perfumes-page"],
  { revalidate: 600, tags: ["perfumes"] },
);

export const DEFAULT_PERFUME_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export async function getPerfumeSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.perfume.findMany({
      select: { slug: true },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => r.slug);
  } catch (err) {
    logRepoError("getPerfumeSlugs", err);
    return [];
  }
}

export async function getPerfumesByBrandSlug(slug: string): Promise<StaticPerfume[]> {
  try {
    const rows = await prisma.perfume.findMany({
      where: { brand: { slug } },
      include: PERFUME_INCLUDE,
      orderBy: { name: "asc" },
    });
    return rows.map(mapPerfume);
  } catch (err) {
    logRepoError("getPerfumesByBrandSlug", err);
    return [];
  }
}

export async function getPerfumeBySlug(slug: string): Promise<PerfumeDetail | null> {
  try {
    const p = await prisma.perfume.findFirst({
      where: { slug },
      include: PERFUME_INCLUDE,
    });
    if (!p) return null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      image: p.image,
      description: p.description,
      gender: p.gender,
      concentration: p.concentration,
      family: p.fragranceFamily,
      releaseYear: p.releaseYear,
      perfumer: p.perfumer,
      brand: { name: p.brand.name, slug: p.brand.slug, country: p.brand.country },
      notes: p.notes.map((pn) => ({ name: pn.note.name, layer: pn.layer })),
    };
  } catch (err) {
    logRepoError("getPerfumeBySlug", err);
    return null;
  }
}
