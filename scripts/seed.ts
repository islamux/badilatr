import { eq } from "drizzle-orm";

import { getDb } from "../src/server/db/client";
import {
  brands,
  notes,
  perfumeNotes,
  perfumes,
} from "../src/server/db/schema";
import { seedBrands, seedNotes, seedPerfumes } from "./seed-data";

async function main() {
  const db = getDb();

  // 1. Brands & notes (idempotent).
  await db.insert(brands).values(seedBrands).onConflictDoNothing({
    target: brands.slug,
  });
  await db.insert(notes).values(seedNotes).onConflictDoNothing({
    target: notes.slug,
  });

  // 2. Build slug → id maps.
  const brandRows = await db
    .select({ id: brands.id, slug: brands.slug })
    .from(brands);
  const noteRows = await db
    .select({ id: notes.id, slug: notes.slug })
    .from(notes);
  const brandId = new Map(brandRows.map((r) => [r.slug, r.id]));
  const noteId = new Map(noteRows.map((r) => [r.slug, r.id]));

  // 3. Perfumes (resolve brandId from slug). Idempotent on slug.
  const perfumeValues = seedPerfumes.map((p) => ({
    brandId: brandId.get(p.brandSlug)!,
    name: p.name,
    slug: p.slug,
    releaseYear: p.releaseYear,
    perfumer: p.perfumer,
    gender: p.gender,
    concentration: p.concentration,
    fragranceFamily: p.family,
    description: p.description,
    image: null,
  }));
  await db.insert(perfumes).values(perfumeValues).onConflictDoNothing({
    target: perfumes.slug,
  });

  const perfumeRows = await db
    .select({ id: perfumes.id, slug: perfumes.slug })
    .from(perfumes);
  const perfumeId = new Map(perfumeRows.map((r) => [r.slug, r.id]));

  // 4. Perfume ↔ note links (idempotent on composite PK).
  const linkValues = [];
  for (const p of seedPerfumes) {
    const pid = perfumeId.get(p.slug);
    if (!pid) continue;
    for (const n of p.notes) {
      const nid = noteId.get(n.slug);
      if (!nid) {
        console.warn(`  ! unknown note "${n.slug}" referenced by ${p.slug}`);
        continue;
      }
      linkValues.push({ perfumeId: pid, noteId: nid, layer: n.layer });
    }
  }
  await db.insert(perfumeNotes).values(linkValues).onConflictDoNothing();

  console.log(
    `✓ Seeded: ${brandRows.length} brands, ${noteRows.length} notes, ${perfumeRows.length} perfumes, ${linkValues.length} note links.`
  );

  // Sanity: confirm a known perfume resolves with its brand + notes.
  const sample = await db
    .select({ name: perfumes.name, family: perfumes.fragranceFamily })
    .from(perfumes)
    .where(eq(perfumes.slug, "lattafa-asad"))
    .limit(1);
  console.log("  sample:", sample[0]);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
