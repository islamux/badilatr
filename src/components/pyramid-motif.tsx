import { cn } from "@/lib/utils";
import { LAYER_LABELS, catalogLocale } from "@/lib/catalog-labels";
import type { NoteLayer } from "@/data/perfumes";

const STACK: {
  key: NoteLayer;
  width: string;
  bar: string;
  glow: string;
}[] = [
  { key: "top", width: "w-1/2", bar: "bg-saffron", glow: "shadow-[0_0_24px_-4px_var(--saffron)]" },
  { key: "heart", width: "w-3/4", bar: "bg-rose", glow: "shadow-[0_0_24px_-4px_var(--rose)]" },
  { key: "base", width: "w-full", bar: "bg-amber", glow: "shadow-[0_0_24px_-4px_var(--amber)]" },
];

export function PyramidMotif({
  locale,
  size = "md",
}: {
  locale: string;
  size?: "sm" | "md" | "lg";
}) {
  const lang = catalogLocale(locale);
  const heights = {
    sm: "h-8",
    md: "h-11",
    lg: "h-14",
  } as const;

  return (
    <div
      aria-hidden
      className="flex w-full max-w-sm flex-col items-center gap-1.5"
    >
      {STACK.map((layer) => (
        <div
          key={layer.key}
          className={cn(
            "flex items-center justify-center rounded-md transition-all duration-300 hover:scale-[1.03]",
            heights[size],
            layer.width,
            layer.bar,
            layer.glow,
          )}
        >
          <span className="text-xs font-medium tracking-wide text-background">
            {LAYER_LABELS[layer.key][lang]}
          </span>
        </div>
      ))}
    </div>
  );
}
