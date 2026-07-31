export type NoteLayer = "top" | "heart" | "base";

export type StaticNote = { name: string; layer: NoteLayer };

export type StaticPerfume = {
  name: string;
  slug: string;
  brand: string;
  description: string | null;
  gender: "male" | "female" | "unisex" | null;
  concentration: "edt" | "edp" | "parfum" | "extrait" | null;
  family: "woody" | "oriental" | "fresh" | "floral" | "gourmand" | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  notes: StaticNote[];
};
