import { z } from "zod";

import type { StaticPerfume } from "@/data/perfumes";
import { logRepoError } from "@/lib/repo-utils";
import { prisma } from "@/server/db/client";
import { mapPerfume } from "@/server/repositories/perfumes";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 200;
const MIN_TRIGRAM_SCORE = 0.1;
const MAX_RESULTS = 20;

const querySchema = z
  .string()
  .trim()
  .min(MIN_QUERY_LENGTH)
  .max(MAX_QUERY_LENGTH);

export async function searchPerfumes(query: string): Promise<StaticPerfume[]> {
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) return [];
  const q = parsed.data;

  try {
    const ranked = await prisma.$queryRaw<{ slug: string }[]>`
      SELECT slug FROM (
        SELECT p.slug,
          ts_rank(
            to_tsvector('simple', coalesce(p.name,'') || ' ' || coalesce(b.name,'') || ' ' || coalesce(p.description,'')),
            plainto_tsquery('simple', ${q})
          ) AS fts,
          greatest(
            similarity(p.name, ${q}),
            similarity(coalesce(b.name,''), ${q})
          ) AS trgm
        FROM perfumes p
        JOIN brands b ON b.id = p.brand_id
      ) s
      WHERE fts > 0 OR trgm > ${MIN_TRIGRAM_SCORE}
      ORDER BY (fts + trgm) DESC, slug ASC
      LIMIT ${MAX_RESULTS}
    `;
    if (!ranked.length) return [];

    const slugs = ranked.map((r) => r.slug);
    const rows = await prisma.perfume.findMany({
      where: { slug: { in: slugs } },
      include: { brand: true, notes: { include: { note: true } } },
    });
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    return slugs
      .map((slug) => bySlug.get(slug))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(mapPerfume);
  } catch (err) {
    logRepoError("searchPerfumes", err);
    return [];
  }
}
