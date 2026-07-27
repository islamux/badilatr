import type { BrandDetail, BrandSummary } from "@/types/catalog";
import { prisma } from "@/server/db/client";

export async function getAllBrands(): Promise<BrandSummary[]> {
  const rows = await prisma.brand.findMany({
    include: { _count: { select: { perfumes: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map((b) => ({
    slug: b.slug,
    name: b.name,
    country: b.country,
    logo: b.logo,
    type: b.type,
    perfumeCount: b._count.perfumes,
  }));
}

export async function getBrandBySlug(
  slug: string,
): Promise<BrandDetail | null> {
  const b = await prisma.brand.findUnique({ where: { slug } });
  if (!b) return null;
  return {
    slug: b.slug,
    name: b.name,
    country: b.country,
    foundedYear: b.foundedYear,
    logo: b.logo,
    description: b.description,
    type: b.type,
  };
}
