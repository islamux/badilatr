import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  FAMILY_LABELS,
  GENDER_LABELS,
  LAYER_ACCENT,
  LAYER_LABELS,
  catalogLocale,
  tEnum,
} from "@/lib/catalog-labels";
import type { StaticPerfume } from "@/data/perfumes";

const NOTE_LAYERS = ["top", "heart", "base"] as const;

function firstNotePlusCount(names: string[]): string {
  if (!names.length) return "";
  return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
}

export function PerfumeCard({
  perfume,
  locale,
}: {
  perfume: StaticPerfume;
  locale: string;
}) {
  const lang = catalogLocale(locale);
  const notesByLayer: Record<string, string[]> = { top: [], heart: [], base: [] };
  for (const n of perfume.notes) {
    (notesByLayer[n.layer] ?? []).push(n.name);
  }

  return (
    <Link
      href={`/perfumes/${perfume.slug}`}
      locale={lang}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
    >
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {perfume.image_url ? (
            <Image
              src={perfume.image_url}
              alt={perfume.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl opacity-30">
              🧴
            </div>
          )}
          {perfume.family && (
            <Badge
              variant="gold"
              className="absolute end-2 top-2 text-caption capitalize backdrop-blur-sm"
            >
              {tEnum(perfume.family, FAMILY_LABELS, locale)}
            </Badge>
          )}
        </div>

        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-card-name" title={perfume.name}>
                {perfume.name}
              </h3>
              <p className="truncate text-meta text-muted-foreground">
                {perfume.brand}
              </p>
            </div>
            {perfume.price != null && perfume.currency && (
              <span className="shrink-0 text-card-name font-medium text-gold">
                {perfume.price} {perfume.currency}
              </span>
            )}
          </div>

          {perfume.gender && GENDER_LABELS[perfume.gender] && (
            <Badge variant="outline" className="text-caption">
              {GENDER_LABELS[perfume.gender][lang]}
            </Badge>
          )}

          <div className="space-y-1.5 pt-1">
            {NOTE_LAYERS.map((layer) => {
              const names = notesByLayer[layer];
              if (!names.length) return null;
              return (
                <div key={layer} className="flex items-start gap-1.5">
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 text-caption",
                      LAYER_ACCENT[layer],
                    )}
                  >
                    {LAYER_LABELS[layer][lang]}:
                  </span>
                  <span
                    title={names.join(" · ")}
                    className="text-card-body text-muted-foreground"
                  >
                    {firstNotePlusCount(names)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
