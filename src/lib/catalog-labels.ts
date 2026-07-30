import type { NoteLayer } from "@/data/perfumes";

export type Bilingual = { ar: string; en: string };
export type CatalogLocale = "ar" | "en";

export function catalogLocale(locale: string): CatalogLocale {
  return locale === "ar" ? "ar" : "en";
}

export const LAYER_LABELS: Record<NoteLayer, Bilingual> = {
  top: { ar: "علوية", en: "Top" },
  heart: { ar: "وسطى", en: "Heart" },
  base: { ar: "قاعدية", en: "Base" },
};

export const LAYER_ACCENT: Record<NoteLayer, string> = {
  top: "text-saffron",
  heart: "text-rose",
  base: "text-amber",
};

export const LAYER_BAR: Record<NoteLayer, string> = {
  top: "bg-saffron/15",
  heart: "bg-rose/15",
  base: "bg-amber/15",
};

export const GENDER_LABELS: Record<string, Bilingual> = {
  male: { ar: "رجالي", en: "Men" },
  female: { ar: "نسائي", en: "Women" },
  unisex: { ar: "للجنسين", en: "Unisex" },
};

export const BRAND_TYPE_LABELS: Record<string, Bilingual> = {
  arabic: { ar: "عربية", en: "Arabic" },
  designer: { ar: "تصميمية", en: "Designer" },
  niche: { ar: "نيش", en: "Niche" },
};

export const CONCENTRATION_LABELS: Record<string, Bilingual> = {
  edt: { ar: "أو دو تواليت", en: "Eau de Toilette" },
  edp: { ar: "أو دو بارفان", en: "Eau de Parfum" },
  parfum: { ar: "بارفان", en: "Parfum" },
  extrait: { ar: "إكستري", en: "Extrait de Parfum" },
};

export const FAMILY_LABELS: Record<string, Bilingual> = {
  woody: { ar: "خشبية", en: "Woody" },
  oriental: { ar: "شرقية", en: "Oriental" },
  fresh: { ar: "منعشة", en: "Fresh" },
  floral: { ar: "زهرية", en: "Floral" },
  gourmand: { ar: "حلوة", en: "Gourmand" },
};

export function tEnum(
  value: string | null | undefined,
  map: Record<string, Bilingual>,
  locale: string,
): string {
  if (!value) return "";
  const lang = catalogLocale(locale);
  return map[value]?.[lang] ?? value;
}

export function perfumeCountLabel(count: number, locale: string): string {
  return locale === "ar" ? `${count} عطر` : `${count} perfumes`;
}
