import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { PerfumeCard } from "@/components/perfume-card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { BRAND_TYPE_LABELS, tEnum } from "@/lib/catalog-labels";
import { getBrandBySlug } from "@/server/repositories/brands";
import { getPerfumesByBrandSlug } from "@/server/repositories/perfumes";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) return {};
  return { title: brand.name, description: brand.description ?? undefined };
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BrandDetail");
  const tNav = await getTranslations("Nav");
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const perfumes = await getPerfumesByBrandSlug(brand.slug);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12">
      <Link
        href="/brands"
        locale={locale as "ar" | "en"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {tNav("brands")}
      </Link>
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{brand.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {brand.country && (
            <span>
              {t("country")}: {brand.country}
            </span>
          )}
          {brand.foundedYear && (
            <span>
              {t("founded")}: {brand.foundedYear}
            </span>
          )}
          <span>
            {t("type")}: {tEnum(brand.type, BRAND_TYPE_LABELS, locale)}
          </span>
        </div>
        {brand.description && (
          <p className="text-muted-foreground">{brand.description}</p>
        )}
      </header>
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("catalog")}
          </h2>
          <Badge variant="gold" className="text-xs">
            {perfumes.length}
          </Badge>
        </div>
        {perfumes.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {perfumes.map((p) => (
              <PerfumeCard key={p.slug} perfume={p} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        )}
      </section>
    </div>
  );
}
