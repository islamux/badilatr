import type { StaticPerfume } from "@/data/perfumes";
import { Prisma } from "@prisma/client";
import type { PerfumeDetail } from "@/types/catalog";
import { prisma } from "@/server/db/client";

type PerfumeWithRelations = Prisma.PerfumeGetPayload<{
  include: { brand: true; notes: { include: { note: true } } };
}>;

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

export async function getLandingPerfumes(): Promise<StaticPerfume[]> {
  const rows = await prisma.perfume.findMany({
    include: { brand: true, notes: { include: { note: true } } },
    orderBy: { id: "asc" },
  });
  return rows.map(mapPerfume);
}

export async function getAllPerfumes(): Promise<StaticPerfume[]> {
  const rows = await prisma.perfume.findMany({
    include: { brand: true, notes: { include: { note: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map(mapPerfume);
}

export async function getPerfumeBySlug(
  slug: string,
): Promise<PerfumeDetail | null> {
  const p = await prisma.perfume.findFirst({
    where: { slug },
    include: { brand: true, notes: { include: { note: true } } },
  });
  if (!p) return null;
  return {
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
}
