import { Search } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { SearchResults } from "@/components/search-results";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPerfumes } from "@/server/repositories/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Search");
  const perfumes = await searchPerfumes(q);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("title")}
      </h1>
      <form
        action={`/${locale}/search`}
        method="get"
        className="flex w-full max-w-xl items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t("placeholder")}
            className="h-12 ps-9 text-base"
            aria-label={t("placeholder")}
          />
        </div>
        <Button type="submit" size="lg" className="h-12">
          {t("button")}
        </Button>
      </form>
      {perfumes.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {t("count", { count: perfumes.length })}
        </p>
      )}
      <SearchResults
        query={q}
        perfumes={perfumes}
        locale={locale}
        emptyText={q ? t("noResults", { query: q }) : ""}
      />
    </div>
  );
}
