import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StaticPerfume } from "@/data/perfumes";

const LAYER_LABELS: Record<string, { ar: string; en: string; color: string }> =
  {
    top: { ar: "علوية", en: "Top", color: "text-amber-400" },
    heart: { ar: "وسطى", en: "Heart", color: "text-rose-400" },
    base: { ar: "قاعدية", en: "Base", color: "text-violet-400" },
  };

const GENDER_LABELS: Record<string, { ar: string; en: string }> = {
  male: { ar: "رجالي", en: "Men" },
  female: { ar: "نسائي", en: "Women" },
  unisex: { ar: "للجنسين", en: "Unisex" },
};

export function PerfumeCard({
  perfume,
  locale,
}: {
  perfume: StaticPerfume;
  locale: string;
}) {
  const isAr = locale === "ar";
  const topNotes = perfume.notes.filter((n) => n.layer === "top");
  const heartNotes = perfume.notes.filter((n) => n.layer === "heart");
  const baseNotes = perfume.notes.filter((n) => n.layer === "base");

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
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
            className="absolute end-2 top-2 text-[10px] capitalize backdrop-blur-sm"
          >
            {perfume.family}
          </Badge>
        )}
      </div>

      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-sm" title={perfume.name}>
              {perfume.name}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {perfume.brand}
            </p>
          </div>
          {perfume.price && (
            <span className="shrink-0 text-sm font-medium text-gold">
              {perfume.price} {perfume.currency}
            </span>
          )}
        </div>

        {perfume.gender && GENDER_LABELS[perfume.gender] && (
          <Badge variant="outline" className="text-[10px]">
            {GENDER_LABELS[perfume.gender][isAr ? "ar" : "en"]}
          </Badge>
        )}

        <div className="space-y-1.5 pt-1">
          {[
            { notes: topNotes, layer: "top" },
            { notes: heartNotes, layer: "heart" },
            { notes: baseNotes, layer: "base" },
          ].map(({ notes, layer }) => {
            if (!notes.length) return null;
            const label = LAYER_LABELS[layer];
            return (
              <div key={layer} className="flex items-start gap-1.5">
                <span
                  className={cn(
                    "mt-0.5 shrink-0 text-[10px] font-medium",
                    label.color
                  )}
                >
                  {label[isAr ? "ar" : "en"]}:
                </span>
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  {notes.map((n) => n.name).join(" · ")}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
