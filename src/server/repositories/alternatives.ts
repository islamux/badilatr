import type { Alternative } from "@/types/catalog";
import type { LayeredNotes } from "@/lib/similarity";
import { computeSimilarityScore } from "@/lib/similarity";
import { logRepoError } from "@/lib/repo-utils";
import { prisma } from "@/server/db/client";

const MAX_CANDIDATES = 10;
const MIN_SCORE = 15;

function toLayeredNotes(
  notes: { layer: string; note: { name: string } }[],
): LayeredNotes {
  const result: LayeredNotes = { top: [], heart: [], base: [] };
  for (const pn of notes) {
    const layer = pn.layer === "middle" ? "heart" : (pn.layer as "top" | "heart" | "base");
    if (layer === "top" || layer === "heart" || layer === "base") {
      result[layer].push(pn.note.name);
    }
  }
  return result;
}

export async function getAlternatives(perfumeId: number): Promise<Alternative[]> {
  try {
    const candidates = await prisma.$queryRaw<{ id: number }[]>`
      SELECT p.id
      FROM perfumes p
      JOIN perfume_notes pn ON pn.perfume_id = p.id
      WHERE pn.note_id IN (SELECT note_id FROM perfume_notes WHERE perfume_id = ${perfumeId})
        AND p.id <> ${perfumeId}
      GROUP BY p.id
      ORDER BY count(*) DESC
      LIMIT ${MAX_CANDIDATES}
    `;
    if (candidates.length === 0) return [];

    const allIds = [perfumeId, ...candidates.map((c) => c.id)];
    const rows = await prisma.perfume.findMany({
      where: { id: { in: allIds } },
      include: { brand: true, notes: { include: { note: true } } },
    });

    const target = rows.find((r) => r.id === perfumeId);
    if (!target) return [];
    const targetNotes = toLayeredNotes(target.notes);

    const candidateRows = candidates
      .map((c) => rows.find((r) => r.id === c.id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));

    return candidateRows
      .map((r) => {
        const result = computeSimilarityScore(targetNotes, toLayeredNotes(r.notes));
        return {
          slug: r.slug,
          name: r.name,
          image: r.image,
          brand: { name: r.brand.name, slug: r.brand.slug },
          score: result.score,
          sharedNotes: result.shared,
          onlyOriginal: result.onlyOriginal,
          onlyAlternative: result.onlyAlternative,
        };
      })
      .filter((a) => a.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score);
  } catch (err) {
    logRepoError("getAlternatives", err);
    return [];
  }
}
