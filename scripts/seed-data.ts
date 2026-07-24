/**
 * Curated seed data — Phase 1 focus: Arabic perfume houses.
 * Real houses; note pyramids are representative approximations.
 */

export type SeedBrand = {
  name: string;
  slug: string;
  country: string;
  foundedYear: number;
  type: "arabic" | "designer" | "niche";
  description: string;
};

export type SeedNote = { name: string; slug: string };

export type NoteLayer = "top" | "heart" | "base";

export type SeedPerfumeNote = { slug: string; layer: NoteLayer };

export type SeedPerfume = {
  name: string;
  slug: string;
  brandSlug: string;
  releaseYear: number;
  perfumer: string | null;
  gender: "male" | "female" | "unisex";
  concentration: "edt" | "edp" | "parfum" | "extrait";
  family: "woody" | "oriental" | "fresh" | "floral" | "gourmand";
  description: string;
  notes: SeedPerfumeNote[];
};

export const seedBrands: SeedBrand[] = [
  {
    name: "Lattafa",
    slug: "lattafa",
    country: "United Arab Emirates",
    foundedYear: 2014,
    type: "arabic",
    description:
      "Emirati house known for affordable, high-impact interpretations of designer fragrances.",
  },
  {
    name: "Ard Al Zaafaran",
    slug: "ard-al-zaafaran",
    country: "United Arab Emirates",
    foundedYear: 2010,
    type: "arabic",
    description:
      "Dubai-based perfumer specializing in traditional oriental and oud blends at accessible prices.",
  },
  {
    name: "Arabian Oud",
    slug: "arabian-oud",
    country: "Saudi Arabia",
    foundedYear: 1982,
    type: "arabic",
    description:
      "The largest fragrance house in the Middle East, famed for premium oud and oriental compositions.",
  },
  {
    name: "Abdul Samad Al Qurashi",
    slug: "abdul-samad-al-qurashi",
    country: "Saudi Arabia",
    foundedYear: 1932,
    type: "arabic",
    description:
      "Legendary Makkah-based house renowned for pure oud, musk, and rose oils.",
  },
  {
    name: "Rasasi",
    slug: "rasasi",
    country: "United Arab Emirates",
    foundedYear: 1979,
    type: "arabic",
    description:
      "Family-owned house blending oriental tradition with western perfumery structure.",
  },
  {
    name: "Al Haramain",
    slug: "al-haramain",
    country: "United Arab Emirates",
    foundedYear: 1970,
    type: "arabic",
    description:
      "Global oriental house celebrated for rich amber, oud, and spicy signatures.",
  },
  {
    name: "Ajmal",
    slug: "ajmal",
    country: "United Arab Emirates",
    foundedYear: 1951,
    type: "arabic",
    description:
      "Pioneer of Arabian perfumery with deep expertise in dehn al-oud and attars.",
  },
  {
    name: "Swiss Arabian",
    slug: "swiss-arabian",
    country: "United Arab Emirates",
    foundedYear: 2006,
    type: "arabic",
    description:
      "Fuses Swiss perfumery craft with Middle Eastern ingredients and sensibility.",
  },
];

export const seedNotes: SeedNote[] = [
  "Oud",
  "Amber",
  "Musk",
  "Rose",
  "Saffron",
  "Sandalwood",
  "Vanilla",
  "Bergamot",
  "Jasmine",
  "Patchouli",
  "Cedarwood",
  "Leather",
  "Honey",
  "Cinnamon",
  "Cardamom",
  "Pink Pepper",
  "Lavender",
  "Tobacco",
  "Orange Blossom",
  "Vetiver",
  "Pineapple",
  "Sage",
  "Geranium",
  "Nutmeg",
].map((name) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
}));

export const seedPerfumes: SeedPerfume[] = [
  {
    name: "Asad",
    slug: "lattafa-asad",
    brandSlug: "lattafa",
    releaseYear: 2021,
    perfumer: null,
    gender: "unisex",
    concentration: "extrait",
    family: "oriental",
    description:
      "A bold, spicy-amber extrait frequently cited as a powerhouse alternative to Dior Sauvage Elixir.",
    notes: [
      { slug: "pink-pepper", layer: "top" },
      { slug: "nutmeg", layer: "top" },
      { slug: "pineapple", layer: "top" },
      { slug: "sage", layer: "heart" },
      { slug: "tobacco", layer: "heart" },
      { slug: "vanilla", layer: "base" },
      { slug: "amber", layer: "base" },
    ],
  },
  {
    name: "Khamrah",
    slug: "lattafa-khamrah",
    brandSlug: "lattafa",
    releaseYear: 2022,
    perfumer: null,
    gender: "unisex",
    concentration: "edp",
    family: "gourmand",
    description:
      "A warm, sweet cinnamon-vanilla gourmand with a creamy, festive dry-down.",
    notes: [
      { slug: "cinnamon", layer: "top" },
      { slug: "cardamom", layer: "top" },
      { slug: "bergamot", layer: "top" },
      { slug: "orange-blossom", layer: "heart" },
      { slug: "jasmine", layer: "heart" },
      { slug: "vanilla", layer: "base" },
      { slug: "honey", layer: "base" },
    ],
  },
  {
    name: "Oud 24 Hours",
    slug: "ard-al-zaafaran-oud-24-hours",
    brandSlug: "ard-al-zaafaran",
    releaseYear: 2018,
    perfumer: null,
    gender: "unisex",
    concentration: "edp",
    family: "woody",
    description:
      "An affordable woody-oud with saffron and rose, delivering all-day projection.",
    notes: [
      { slug: "saffron", layer: "top" },
      { slug: "bergamot", layer: "top" },
      { slug: "rose", layer: "heart" },
      { slug: "jasmine", layer: "heart" },
      { slug: "oud", layer: "base" },
      { slug: "amber", layer: "base" },
      { slug: "sandalwood", layer: "base" },
    ],
  },
  {
    name: "Kalemat",
    slug: "arabian-oud-kalemat",
    brandSlug: "arabian-oud",
    releaseYear: 2010,
    perfumer: null,
    gender: "unisex",
    concentration: "edp",
    family: "oriental",
    description:
      "A refined honeyed incense-oud with berry and saffron accents from Arabian Oud.",
    notes: [
      { slug: "saffron", layer: "top" },
      { slug: "cardamom", layer: "top" },
      { slug: "rose", layer: "heart" },
      { slug: "leather", layer: "heart" },
      { slug: "oud", layer: "base" },
      { slug: "amber", layer: "base" },
      { slug: "honey", layer: "base" },
    ],
  },
  {
    name: "Hawas",
    slug: "rasasi-hawas",
    brandSlug: "rasasi",
    releaseYear: 2015,
    perfumer: null,
    gender: "male",
    concentration: "edp",
    family: "fresh",
    description:
      "A fruity-aquatic fresh spicy scent with strong projection, often compared to Paco Rabanne 1 Million.",
    notes: [
      { slug: "bergamot", layer: "top" },
      { slug: "pineapple", layer: "top" },
      { slug: "jasmine", layer: "heart" },
      { slug: "sage", layer: "heart" },
      { slug: "vetiver", layer: "base" },
      { slug: "cedarwood", layer: "base" },
      { slug: "musk", layer: "base" },
    ],
  },
  {
    name: "Amber Oud",
    slug: "al-haramain-amber-oud",
    brandSlug: "al-haramain",
    releaseYear: 2016,
    perfumer: null,
    gender: "unisex",
    concentration: "edp",
    family: "oriental",
    description:
      "A smooth saffron-rose-oud over a warm amber-musk base — a modern oriental signature.",
    notes: [
      { slug: "saffron", layer: "top" },
      { slug: "bergamot", layer: "top" },
      { slug: "rose", layer: "heart" },
      { slug: "jasmine", layer: "heart" },
      { slug: "oud", layer: "base" },
      { slug: "amber", layer: "base" },
      { slug: "musk", layer: "base" },
    ],
  },
  {
    name: "Amber Wood",
    slug: "ajmal-amber-wood",
    brandSlug: "ajmal",
    releaseYear: 2013,
    perfumer: null,
    gender: "unisex",
    concentration: "edp",
    family: "woody",
    description:
      "A woody-amber with spicy cardamom and a creamy sandalwood-patchouli dry-down.",
    notes: [
      { slug: "bergamot", layer: "top" },
      { slug: "cardamom", layer: "top" },
      { slug: "rose", layer: "heart" },
      { slug: "patchouli", layer: "heart" },
      { slug: "sandalwood", layer: "base" },
      { slug: "amber", layer: "base" },
      { slug: "cedarwood", layer: "base" },
    ],
  },
  {
    name: "Shaghaf Pour Homme",
    slug: "swiss-arabian-shaghaf-pour-homme",
    brandSlug: "swiss-arabian",
    releaseYear: 2014,
    perfumer: null,
    gender: "male",
    concentration: "edp",
    family: "fresh",
    description:
      "A fresh-spicy aromatic with lavender and citrus over a clean woody-musk base.",
    notes: [
      { slug: "bergamot", layer: "top" },
      { slug: "cardamom", layer: "top" },
      { slug: "lavender", layer: "heart" },
      { slug: "geranium", layer: "heart" },
      { slug: "vetiver", layer: "base" },
      { slug: "cedarwood", layer: "base" },
      { slug: "musk", layer: "base" },
    ],
  },
];
