import type { CatalogNote } from "@/types/catalog";
import { cn } from "@/lib/utils";

type Layer = "top" | "heart" | "base";

const LAYERS: Record<Layer, { ar: string; en: string; color: string }> = {
  top: { ar: "علوية", en: "Top", color: "text-amber-400" },
  heart: { ar: "وسطى", en: "Heart", color: "text-rose-400" },
  base: { ar: "قاعدية", en: "Base", color: "text-violet-400" },
};

export function OlfactoryPyramid({
  notes,
  locale,
}: {
  notes: CatalogNote[];
  locale: string;
}) {
  const isAr = locale === "ar";
  const grouped: Record<Layer, string[]> = { top: [], heart: [], base: [] };
  for (const n of notes) grouped[n.layer].push(n.name);

  return (
    <div className="space-y-3">
      {(Object.keys(LAYERS) as Layer[]).map((layer) => {
        const items = grouped[layer];
        if (!items.length) return null;
        const label = LAYERS[layer];
        return (
          <div key={layer} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-0.5 shrink-0 text-sm font-medium",
                label.color,
              )}
            >
              {isAr ? label.ar : label.en}:
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              {items.join(isAr ? " · " : ", ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
