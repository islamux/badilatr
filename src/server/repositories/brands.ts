import type { BrandDetail, BrandSummary } from "@/types/catalog";
import { logRepoError } from "@/lib/repo-utils";
import { prisma } from "@/server/db/client";

export async function getAllBrands(): Promise<BrandSummary[]> {
  try {
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
  } catch (err) {
    logRepoError("getAllBrands", err);
    return [];
  }
}

export async function getBrandSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.brand.findMany({
      select: { slug: true },
      orderBy: { name: "asc" },
    });
    return rows.map((r) => r.slug);
  } catch (err) {
    logRepoError("getBrandSlugs", err);
    return [];
  }
}

export async function getBrandBySlug(slug: string): Promise<BrandDetail | null> {
  try {
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
  } catch (err) {
    logRepoError("getBrandBySlug", err);
    return null;
  }
}
