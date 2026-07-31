import type { MetadataRoute } from "next";

import { getBrandSlugs } from "@/server/repositories/brands";
import { getPerfumeSlugs } from "@/server/repositories/perfumes";

export const revalidate = 3600;

const LOCALES = ["ar", "en"] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const lastModified = new Date();

  const [perfumeSlugs, brandSlugs] = await Promise.all([
    getPerfumeSlugs(),
    getBrandSlugs(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) => [
    { url: `${siteUrl}/${locale}`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/${locale}/perfumes`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/${locale}/brands`, lastModified, changeFrequency: "weekly", priority: 0.8 },
  ]);

  const perfumeEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    perfumeSlugs.map((slug) => ({
      url: `${siteUrl}/${locale}/perfumes/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  );

  const brandEntries: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    brandSlugs.map((slug) => ({
      url: `${siteUrl}/${locale}/brands/${slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    })),
  );

  return [...staticEntries, ...perfumeEntries, ...brandEntries];
}
