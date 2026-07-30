import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { OlfactoryPyramid } from "@/components/olfactory-pyramid";
import { AlternativesSection } from "@/components/alternatives-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  CONCENTRATION_LABELS,
  FAMILY_LABELS,
  GENDER_LABELS,
  tEnum,
} from "@/lib/catalog-labels";
import { getAlternatives } from "@/server/repositories/alternatives";
import { getPerfumeBySlug } from "@/server/repositories/perfumes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const perfume = await getPerfumeBySlug(slug);
  if (!perfume) return {};
  return {
    title: `${perfume.name} — ${perfume.brand.name}`,
    description: perfume.description ?? undefined,
    openGraph: { images: perfume.image ? [perfume.image] : undefined },
  };
}

export default async function PerfumeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PerfumeDetail");
  const tNav = await getTranslations("Nav");
  const perfume = await getPerfumeBySlug(slug);
  if (!perfume) notFound();

  const alternatives = await getAlternatives(perfume.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: perfume.name,
    brand: { "@type": "Brand", name: perfume.brand.name },
    image: perfume.image ?? undefined,
    description: perfume.description ?? undefined,
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/perfumes"
        locale={locale as "ar" | "en"}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-gold"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {tNav("perfumes")}
      </Link>
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/5] bg-muted">
            {perfume.image ? (
              <Image
                src={perfume.image}
                alt={perfume.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl opacity-30">
                🧴
              </div>
            )}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <div>
            <Link
              href={`/brands/${perfume.brand.slug}`}
              locale={locale as "ar" | "en"}
              className="text-sm text-muted-foreground transition-colors hover:text-gold"
            >
              {perfume.brand.name}
            </Link>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {perfume.name}
            </h1>
          </div>
          {perfume.description && (
            <p className="text-pretty text-muted-foreground">
              {perfume.description}
            </p>
          )}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {perfume.releaseYear && (
              <div>
                <dt className="text-muted-foreground">{t("released")}</dt>
                <dd className="font-medium">{perfume.releaseYear}</dd>
              </div>
            )}
            {perfume.perfumer && (
              <div>
                <dt className="text-muted-foreground">{t("perfumer")}</dt>
                <dd className="font-medium">{perfume.perfumer}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">{t("gender")}</dt>
              <dd className="font-medium">
                {tEnum(perfume.gender, GENDER_LABELS, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("concentration")}</dt>
              <dd className="font-medium">
                {tEnum(perfume.concentration, CONCENTRATION_LABELS, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("family")}</dt>
              <dd>
                <Badge variant="gold">
                  {tEnum(perfume.family, FAMILY_LABELS, locale)}
                </Badge>
              </dd>
            </div>
          </dl>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold">{t("pyramid")}</h2>
              <OlfactoryPyramid notes={perfume.notes} locale={locale} />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-12">
        <AlternativesSection
          alternatives={alternatives}
          locale={locale}
          heading={t("alternatives")}
          sharedLabel={t("sharedNotes")}
          differencesLabel={t("differences")}
          inOriginalLabel={t("inOriginal")}
          inAlternativeLabel={t("inAlternative")}
        />
      </div>
    </div>
  );
}
