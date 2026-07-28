import { PerfumeCard } from "@/components/perfume-card";
import type { StaticPerfume } from "@/data/perfumes";

export function SearchResults({
  query,
  perfumes,
  locale,
  emptyText,
}: {
  query: string;
  perfumes: StaticPerfume[];
  locale: string;
  emptyText: string;
}) {
  if (!perfumes.length) {
    return (
      <p className="text-pretty text-muted-foreground" data-testid="empty">
        {emptyText.replace("{query}", query)}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {perfumes.map((p) => (
        <PerfumeCard key={p.slug} perfume={p} locale={locale} />
      ))}
    </div>
  );
}
