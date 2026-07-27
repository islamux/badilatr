import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { OlfactoryPyramid } from "@/components/olfactory-pyramid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getPerfumeBySlug } from "@/server/repositories/perfumes";

export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<string, { ar: string; en: string }> = {
  male: { ar: "رجالي", en: "Men" },
  female: { ar: "نسائي", en: "Women" },
  unisex: { ar: "للجنسين", en: "Unisex" },
};

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
  const isAr = locale === "ar";
  const perfume = await getPerfumeBySlug(slug);
  if (!perfume) notFound();

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
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/5] bg-muted">
            {perfume.image && (
              <Image
                src={perfume.image}
                alt={perfume.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            )}
          </div>
        </Card>
        <div className="flex flex-col gap-4">
          <div>
            <Link
              href={`/brands/${perfume.brand.slug}`}
              locale={locale as "ar" | "en"}
              className="text-sm text-muted-foreground hover:text-gold"
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
                {GENDER_LABEL[perfume.gender]
                  ? GENDER_LABEL[perfume.gender][isAr ? "ar" : "en"]
                  : perfume.gender}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("concentration")}</dt>
              <dd className="font-medium uppercase">{perfume.concentration}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("family")}</dt>
              <dd>
                <Badge variant="gold" className="capitalize">
                  {perfume.family}
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
    </div>
  );
}
