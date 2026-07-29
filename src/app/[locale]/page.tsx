import { ArrowRight, Search, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PerfumeCard } from "@/components/perfume-card";
import { PyramidMotif } from "@/components/pyramid-motif";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getLandingPerfumes } from "@/server/repositories/perfumes";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");

  const isAr = locale === "ar";

  const perfumes = await getLandingPerfumes();

  const comingSoonSections = [
    { key: "arabicHouses", icon: "🏛️" },
    { key: "communityFavorites", icon: "⭐" },
    { key: "recentlyAdded", icon: "✨" },
  ] as const;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--gold)_18%,transparent),transparent)]"
        />
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col items-center gap-6 text-center md:items-start md:text-start">
            <Badge variant="gold" className="gap-1.5 px-3 py-1 text-sm">
              <Sparkles className="size-3.5" />
              {t("badge")}
            </Badge>

            <h1 className="max-w-2xl text-balance text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>

            <p className="max-w-xl text-pretty text-lg text-muted-foreground">
              {t("subtitle")}
            </p>

            <form
              action={`/${locale}/search`}
              method="get"
              className="mt-2 flex w-full max-w-xl items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder={t("searchPlaceholder")}
                  className="h-12 ps-9 text-base"
                  aria-label={t("search")}
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                {t("search")}
                <ArrowRight className="rtl:rotate-180" />
              </Button>
            </form>
          </div>

          <div className="flex justify-center md:justify-end">
            <PyramidMotif locale={locale} size="lg" />
          </div>
        </div>
      </section>

      {/* Featured perfumes (real scraped data) */}
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="me-2">🔥</span>
              {t("trending")}
            </h2>
            <Badge variant="gold" className="text-xs">
              {perfumes.length} {isAr ? "عطر" : "perfumes"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {perfumes.map((perfume) => (
              <PerfumeCard key={perfume.slug} perfume={perfume} locale={locale} />
            ))}
          </div>
        </section>

        {/* Coming soon sections */}
        {comingSoonSections.map(({ key, icon }) => (
          <section key={key} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                <span className="me-2">{icon}</span>
                {t(key)}
              </h2>
              <Badge variant="outline" className="text-muted-foreground">
                {t("comingSoon")}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/5] w-full rounded-none" />
                  <CardContent className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
