import { prisma } from '../../src/server/db/client';
import { loadFragDb } from './load';
import {
  extractDescription,
  inferBrandType,
  inferConcentration,
  mapFamily,
  mapGender,
  mapLayer,
  slugify,
} from './mappers';
import { run } from '../run';
import type { FragDbBrandRow, Layer, PyramidLayer } from './types';

const PYRAMID_LAYERS: readonly PyramidLayer[] = ['top', 'middle', 'base'] as const;

async function main() {
  const data = await loadFragDb();

  const brandRefByName = new Map<string, FragDbBrandRow>();
  for (const b of data.brands) {
    if (b.name) brandRefByName.set(b.name.toLowerCase(), b);
  }

  const brandInputByName = new Map<
    string,
    { name: string; country: string | null; logo: string | null }
  >();
  for (const p of data.perfumes) {
    if (!p.brand || brandInputByName.has(p.brand)) continue;
    const ref = brandRefByName.get(p.brand.toLowerCase());
    brandInputByName.set(p.brand, {
      name: p.brand,
      country: ref?.country ?? p.brand_country ?? null,
      logo: ref?.logo ?? p.brand_logo ?? null,
    });
  }

  const brandValues = [...brandInputByName.values()].map((b) => ({
    name: b.name,
    slug: slugify(b.name),
    country: b.country,
    logo: b.logo,
    type: inferBrandType(b.name, b.country),
  }));
  if (brandValues.length) {
    await prisma.brand.createMany({ data: brandValues, skipDuplicates: true });
  }

  const noteNames = new Set<string>();
  for (const n of data.notes) if (n.name) noteNames.add(n.name);
  for (const p of data.perfumes) {
    for (const layer of PYRAMID_LAYERS) {
      for (const pn of p.notes[layer]) if (pn.name) noteNames.add(pn.name);
    }
  }
  const noteValues = [...noteNames].map((name) => ({ name, slug: slugify(name) }));
  if (noteValues.length) {
    await prisma.note.createMany({ data: noteValues, skipDuplicates: true });
  }

  const brandRows = await prisma.brand.findMany({ select: { id: true, slug: true } });
  const brandIdBySlug = new Map(brandRows.map((r) => [r.slug, r.id]));
  const noteRows = await prisma.note.findMany({ select: { id: true, slug: true } });
  const noteIdBySlug = new Map(noteRows.map((r) => [r.slug, r.id]));

  const resolvable = data.perfumes.filter(
    (p): p is typeof p & { brand: string; name: string } => Boolean(p.brand) && Boolean(p.name),
  );

  const perfumeValues = resolvable.map((p) => ({
    brandId: brandIdBySlug.get(slugify(p.brand))!,
    name: p.name,
    slug: slugify(`${p.brand} ${p.name}`),
    releaseYear: p.year ?? null,
    perfumer: p.perfumer ?? null,
    gender: mapGender(p.gender.label, p.gender.distribution),
    concentration: inferConcentration(p.name),
    fragranceFamily: mapFamily(p.accords),
    description: extractDescription(p.description),
    image: p.image_urls[0] ?? null,
  }));
  if (perfumeValues.length) {
    await prisma.perfume.createMany({ data: perfumeValues, skipDuplicates: true });
  }

  const perfumeRows = await prisma.perfume.findMany({ select: { id: true, slug: true } });
  const perfumeIdBySlug = new Map(perfumeRows.map((r) => [r.slug, r.id]));

  const linkValues: { perfumeId: number; noteId: number; layer: Layer }[] = [];
  const seenLinks = new Set<string>();
  for (const p of resolvable) {
    const perfumeId = perfumeIdBySlug.get(slugify(`${p.brand} ${p.name}`));
    if (!perfumeId) continue;
    for (const layer of PYRAMID_LAYERS) {
      const mappedLayer = mapLayer(layer);
      for (const pn of p.notes[layer]) {
        if (!pn.name) continue;
        const noteId = noteIdBySlug.get(slugify(pn.name));
        if (!noteId) continue;
        const key = `${perfumeId}|${noteId}`;
        if (seenLinks.has(key)) continue;
        seenLinks.add(key);
        linkValues.push({ perfumeId, noteId, layer: mappedLayer });
      }
    }
  }
  if (linkValues.length) {
    await prisma.perfumeNote.createMany({ data: linkValues, skipDuplicates: true });
  }

  console.log(
    `✓ Seeded from FragDB: ${brandValues.length} brands, ${noteValues.length} notes, ${perfumeValues.length} perfumes, ${linkValues.length} note links.`,
  );
}

void run('Seed', main);
