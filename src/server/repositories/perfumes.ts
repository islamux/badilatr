import type { StaticPerfume } from "@/data/perfumes";
import { prisma } from "@/server/db/client";

export async function getLandingPerfumes(): Promise<StaticPerfume[]> {
  const rows = await prisma.perfume.findMany({
    include: { brand: true, notes: { include: { note: true } } },
    orderBy: { id: "asc" },
  });
  return rows.map((p) => ({
    name: p.name,
    slug: p.slug,
    brand: p.brand.name,
    description: p.description,
    gender: p.gender,
    concentration: p.concentration,
    family: p.fragranceFamily,
    price: null,
    currency: null,
    image_url: p.image,
    notes: p.notes.map((pn) => ({ name: pn.note.name, layer: pn.layer })),
  }));
}
