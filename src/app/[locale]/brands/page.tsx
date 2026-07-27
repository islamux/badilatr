import { setRequestLocale, getTranslations } from "next-intl/server";

import { BrandCard } from "@/components/brand-card";
import { Badge } from "@/components/ui/badge";
import { getAllBrands } from "@/server/repositories/brands";

export const dynamic = "force-dynamic";

export default async function BrandsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Brands");
  const brands = await getAllBrands();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <Badge variant="gold" className="text-xs">
          {t("count", { count: brands.length })}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <BrandCard key={b.slug} brand={b} locale={locale} />
        ))}
      </div>
    </div>
  );
}
