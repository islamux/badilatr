import type { CatalogNote } from "@/types/catalog";
import { cn } from "@/lib/utils";
import {
  LAYER_ACCENT,
  LAYER_BAR,
  LAYER_LABELS,
  catalogLocale,
} from "@/lib/catalog-labels";

type Layer = "top" | "heart" | "base";

const LAYER_ORDER: Layer[] = ["top", "heart", "base"];

const LAYER_WIDTH: Record<Layer, string> = {
  top: "w-2/3 self-center",
  heart: "w-5/6 self-center",
  base: "w-full",
};

export function OlfactoryPyramid({
  notes,
  locale,
}: {
  notes: CatalogNote[];
  locale: string;
}) {
  const lang = catalogLocale(locale);
  const grouped: Record<Layer, string[]> = { top: [], heart: [], base: [] };
  for (const n of notes) {
    if (grouped[n.layer]) grouped[n.layer].push(n.name);
  }

  return (
    <div className="flex flex-col gap-2">
      {LAYER_ORDER.map((layer) => {
        const items = grouped[layer];
        if (!items.length) return null;
        return (
          <div
            key={layer}
            className={cn(
              "rounded-lg border border-border/60 bg-card p-3 transition-colors",
              LAYER_WIDTH[layer],
              LAYER_BAR[layer],
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide",
                  LAYER_ACCENT[layer],
                )}
              >
                {LAYER_LABELS[layer][lang]}
              </span>
              <span className="font-mono text-caption text-muted-foreground">
                {items.length}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">
              {items.join(lang === "ar" ? " · " : ", ")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
