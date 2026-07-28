import type { NoteLayer } from "@/data/perfumes";

export type CatalogNote = { name: string; layer: NoteLayer };

export type PerfumeDetail = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  description: string | null;
  gender: "male" | "female" | "unisex";
  concentration: "edt" | "edp" | "parfum" | "extrait";
  family: "woody" | "oriental" | "fresh" | "floral" | "gourmand";
  releaseYear: number | null;
  perfumer: string | null;
  brand: { name: string; slug: string; country: string | null };
  notes: CatalogNote[];
};

export type BrandSummary = {
  slug: string;
  name: string;
  country: string | null;
  logo: string | null;
  type: "arabic" | "designer" | "niche";
  perfumeCount: number;
};

export type BrandDetail = {
  slug: string;
  name: string;
  country: string | null;
  foundedYear: number | null;
  logo: string | null;
  description: string | null;
  type: "arabic" | "designer" | "niche";
};

export type Alternative = {
  slug: string;
  name: string;
  image: string | null;
  brand: { name: string; slug: string };
  score: number;
  sharedNotes: { name: string; sameLayer: boolean }[];
};
