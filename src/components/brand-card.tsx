import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BRAND_TYPE_LABELS, catalogLocale, perfumeCountLabel } from "@/lib/catalog-labels";
import type { BrandSummary } from "@/types/catalog";

export function BrandCard({
  brand,
  locale,
}: {
  brand: BrandSummary;
  locale: string;
}) {
  const lang = catalogLocale(locale);
  return (
    <Link
      href={`/brands/${brand.slug}`}
      locale={lang}
      className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full transition-shadow group-hover:shadow-lg">
        <CardContent className="flex items-center gap-3 p-4">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary"
          >
            {brand.name.charAt(0)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-semibold">{brand.name}</h3>
              <Badge variant="outline" className="text-caption capitalize">
                {BRAND_TYPE_LABELS[brand.type]?.[lang] ?? brand.type}
              </Badge>
            </div>
            {brand.country && (
              <p className="truncate text-meta text-muted-foreground">
                {brand.country}
              </p>
            )}
            <p className="text-meta text-muted-foreground">
              {perfumeCountLabel(brand.perfumeCount, locale)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
