import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Alternative } from "@/types/catalog";

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 75 ? "gold" : "outline";
  return (
    <Badge variant={variant} className={cn("text-sm font-semibold", score < 50 && "text-muted-foreground")}>
      {score}%
    </Badge>
  );
}

export function AlternativesSection({
  alternatives,
  locale,
  heading,
  sharedLabel,
}: {
  alternatives: Alternative[];
  locale: string;
  heading: string;
  sharedLabel: string;
}) {
  if (!alternatives.length) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((alt) => (
          <Link key={alt.slug} href={`/perfumes/${alt.slug}`} locale={locale as "ar" | "en"}>
            <Card className="h-full transition-shadow hover:shadow-lg">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-sm" title={alt.name}>
                      {alt.name}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">{alt.brand.name}</p>
                  </div>
                  <ScoreBadge score={alt.score} />
                </div>
                {alt.sharedNotes.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {sharedLabel}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {alt.sharedNotes.slice(0, 6).map((note) => (
                        <span
                          key={note.name}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px]",
                            note.sameLayer
                              ? "bg-gold/15 text-gold"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {note.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
