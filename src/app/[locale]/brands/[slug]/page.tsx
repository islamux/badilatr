import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { PerfumeCard } from "@/components/perfume-card";
import { Badge } from "@/components/ui/badge";
import { getBrandBySlug } from "@/server/repositories/brands";
import { getAllPerfumes } from "@/server/repositories/perfumes";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, { ar: string; en: string }> = {
  arabic: { ar: "عربية", en: "Arabic" },
  designer: { ar: "تصميمية", en: "Designer" },
  niche: { ar: "نيش", en: "Niche" },
};

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
  const isAr = locale === "ar";
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const all = await getAllPerfumes();
  const perfumes = all.filter((p) => p.brand === brand.name);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-12">
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
            {t("type")}:{" "}
            {TYPE_LABEL[brand.type]
              ? TYPE_LABEL[brand.type][isAr ? "ar" : "en"]
              : brand.type}
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
