import { setRequestLocale, getTranslations } from "next-intl/server";

import { PerfumeCard } from "@/components/perfume-card";
import { Badge } from "@/components/ui/badge";
import { getAllPerfumes } from "@/server/repositories/perfumes";

export const dynamic = "force-dynamic";

export default async function PerfumesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Perfumes");
  const perfumes = await getAllPerfumes();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <Badge variant="gold" className="text-xs">
          {t("count", { count: perfumes.length })}
        </Badge>
      </div>
      {perfumes.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {perfumes.map((p) => (
            <PerfumeCard key={p.slug} perfume={p} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="text-pretty text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
