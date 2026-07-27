import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BrandSummary } from "@/types/catalog";

const TYPE_LABEL: Record<BrandSummary["type"], { ar: string; en: string }> = {
  arabic: { ar: "عربية", en: "Arabic" },
  designer: { ar: "تصميمية", en: "Designer" },
  niche: { ar: "نيش", en: "Niche" },
};

export function BrandCard({
  brand,
  locale,
}: {
  brand: BrandSummary;
  locale: string;
}) {
  const isAr = locale === "ar";
  const countLabel = isAr
    ? `${brand.perfumeCount} عطر`
    : `${brand.perfumeCount} perfumes`;
  return (
    <Link href={`/brands/${brand.slug}`} locale={locale as "ar" | "en"}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardContent className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{brand.name}</h3>
            <Badge variant="outline" className="text-[10px] capitalize">
              {isAr ? TYPE_LABEL[brand.type].ar : TYPE_LABEL[brand.type].en}
            </Badge>
          </div>
          {brand.country && (
            <p className="text-xs text-muted-foreground">{brand.country}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{countLabel}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
