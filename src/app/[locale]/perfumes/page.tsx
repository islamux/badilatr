import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { setRequestLocale, getTranslations } from "next-intl/server";

import { PerfumeCard } from "@/components/perfume-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PERFUME_PAGE_SIZE,
  getPerfumesPage,
} from "@/server/repositories/perfumes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Perfumes" });
  return { title: t("title") };
}

export default async function PerfumesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const parsedPage = Number.parseInt(pageParam ?? "1", 10);
  const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  setRequestLocale(locale);
  const t = await getTranslations("Perfumes");

  const { items, total, pageSize } = await getPerfumesPage(
    requestedPage,
    DEFAULT_PERFUME_PAGE_SIZE,
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <Badge variant="gold" className="text-xs">
          {t("count", { count: total })}
        </Badge>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <PerfumeCard key={p.slug} perfume={p} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="text-pretty text-muted-foreground">{t("empty")}</p>
      )}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-4 pt-4"
          aria-label={t("title")}
        >
          <Link
            href={{ pathname: "/perfumes", query: { page: currentPage - 1 } }}
            locale={locale as "ar" | "en"}
            aria-label={t("prev")}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              currentPage <= 1 && "pointer-events-none opacity-50",
            )}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </Link>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Link
            href={{ pathname: "/perfumes", query: { page: currentPage + 1 } }}
            locale={locale as "ar" | "en"}
            aria-label={t("next")}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              currentPage >= totalPages && "pointer-events-none opacity-50",
            )}
          >
            <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </nav>
      )}
    </div>
  );
}
