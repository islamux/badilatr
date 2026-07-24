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

export const staticPerfumes: StaticPerfume[] = [
  {
    name: "Kiaana Vibes",
    slug: "afnan-kiaana-vibes",
    brand: "Afnan",
    description: "Bold yet beautifully feminine, Kiaana Vibes is a refined statement fragrance created for women who captivate without effort. It unveils with a luminous, vibrant energy before settling into a smooth, s",
    gender: "male",
    concentration: "edp",
    family: "floral",
    price: 150.0,
    currency: "AED",
    image_url: "https://cdn.shopify.com/s/files/1/0655/0473/9421/files/84.png?v=1776685998",
    notes: [{"name": "Pitahaya", "layer": "top"}, {"name": "Pear", "layer": "top"}, {"name": "Peony", "layer": "heart"}, {"name": "Frangipani", "layer": "heart"}, {"name": "Musk", "layer": "heart"}, {"name": "Patchouli", "layer": "base"}, {"name": "Vanilla", "layer": "base"}, {"name": "Amber", "layer": "base"}],
  },
  {
    name: "Lynked Freedom",
    slug: "afnan-lynked-freedom",
    brand: "Afnan",
    description: "Lynked Freedom is a bold creation that embodies modern masculinity with effortless elegance. Fresh energy meets refined depth, blending crisp brightness with warm sensuality for a fragrance that feels",
    gender: "male",
    concentration: "edp",
    family: "fresh",
    price: 150.0,
    currency: "AED",
    image_url: "https://cdn.shopify.com/s/files/1/0655/0473/9421/files/Lynke-freedom-1.png?v=1763975493",
    notes: [{"name": "Bergamot", "layer": "top"}, {"name": "Grapefruit", "layer": "top"}, {"name": "Sage", "layer": "top"}, {"name": "Lavender", "layer": "heart"}, {"name": "Cardamom", "layer": "heart"}, {"name": "Juniper Berry", "layer": "heart"}, {"name": "Vetiver", "layer": "base"}, {"name": "Oriental", "layer": "base"}, {"name": "Caramel", "layer": "base"}],
  },
  {
    name: "Lynked Forever",
    slug: "afnan-lynked-forever",
    brand: "Afnan",
    description: "Lynked Forever is a luminous and captivating fragrance that celebrates feminine elegance with a touch of modern allure. Radiant florals melt into soft, creamy woods, creating a scent that feels both s",
    gender: "male",
    concentration: "edp",
    family: "woody",
    price: 150.0,
    currency: "AED",
    image_url: "https://cdn.shopify.com/s/files/1/0655/0473/9421/files/Lynked-forever-2.png?v=1763975491",
    notes: [{"name": "Mandarin", "layer": "top"}, {"name": "Berries", "layer": "top"}, {"name": "Gardenia", "layer": "heart"}, {"name": "Tuberose", "layer": "heart"}, {"name": "Ylang", "layer": "heart"}, {"name": "Coconut", "layer": "base"}, {"name": "Sandalwood", "layer": "base"}, {"name": "Musk", "layer": "base"}, {"name": "Dry woods", "layer": "base"}],
  },
  {
    name: "9 PM Elixir",
    slug: "afnan-9-pm-elixir",
    brand: "Afnan",
    description: "9PM Elixir is a captivating symphony of warmth, depth, and refined allure. It opens with a luminous spice that feels both vibrant and mysterious, setting the tone for a fragrance that commands attenti",
    gender: "male",
    concentration: "extrait",
    family: "oriental",
    price: 120.0,
    currency: "AED",
    image_url: "https://cdn.shopify.com/s/files/1/0655/0473/9421/files/9PM_ELIXIR-1.png?v=1753259405",
    notes: [{"name": "Nutmeg", "layer": "top"}, {"name": "Elemi", "layer": "top"}, {"name": "Cardamom", "layer": "top"}, {"name": "Pimento", "layer": "heart"}, {"name": "Lavandin", "layer": "heart"}, {"name": "Leather", "layer": "heart"}, {"name": "Ciste", "layer": "base"}, {"name": "Labdanum", "layer": "base"}, {"name": "Patchouli", "layer": "base"}, {"name": "Vanilla", "layer": "base"}],
  },
  {
    name: "Historic Sahara",
    slug: "afnan-historic-sahara",
    brand: "Afnan",
    description: "A scent that captures the timeless allure of golden dunes and ancient journeys. Historic Sahara unfolds like a warm desert breeze - mysterious, inviting, and endlessly captivating. With a smooth fusio",
    gender: "male",
    concentration: "extrait",
    family: "woody",
    price: 180.0,
    currency: "AED",
    image_url: "https://cdn.shopify.com/s/files/1/0655/0473/9421/files/HistoricSahara.png?v=1744872870",
    notes: [{"name": "Bergamot", "layer": "top"}, {"name": "Cinnamon", "layer": "top"}, {"name": "Cardamom", "layer": "top"}, {"name": "Elemi", "layer": "heart"}, {"name": "Vanilla", "layer": "heart"}, {"name": "Sugar", "layer": "heart"}, {"name": "Musk", "layer": "base"}, {"name": "Almond", "layer": "base"}, {"name": "Tonka", "layer": "base"}, {"name": "Wood", "layer": "base"}, {"name": "Praline", "layer": "base"}, {"name": "Ambroxan", "layer": "base"}],
  },
  {
    name: "Turathi Electric",
    slug: "afnan-turathi-electric",
    brand: "Afnan",
    description: "A rush of crsip bright energy on a sunlit day - Turathi Electric captures the spirit of endless summer. It opens with a radiant freshness that instantly lifts the mood, like a breeze cutting through w",
    gender: "male",
    concentration: "edp",
    family: "woody",
    price: 150.0,
    currency: "AED",
    image_url: "https://cdn.shopify.com/s/files/1/0655/0473/9421/files/TurathiElectric.png?v=1744872863",
    notes: [{"name": "Bergamot", "layer": "top"}, {"name": "Pink Grapefruit", "layer": "top"}, {"name": "Pear", "layer": "top"}, {"name": "Mandarin", "layer": "top"}, {"name": "Apple", "layer": "heart"}, {"name": "Cedarwood", "layer": "heart"}, {"name": "Orange Blossom", "layer": "heart"}, {"name": "Vanilla", "layer": "base"}, {"name": "Amber Dry", "layer": "base"}, {"name": "Musk", "layer": "base"}, {"name": "Ambroxan", "layer": "base"}],
  },
  {
    name: "Rare Reef",
    slug: "afnan-rare-reef",
    brand: "Afnan",
    description: "Fresh, bright, and pure - Rare Reef brings the feeling of a peaceful escape by the ocean. It opens with a burst of energy, then softens into smooth, green layers that feel both refreshing and calm. Th",
    gender: "male",
    concentration: "extrait",
    family: "woody",
    price: 120.0,
    currency: "AED",
    image_url: "https://cdn.shopify.com/s/files/1/0655/0473/9421/files/Rare_Reef_1.png?v=1746801626",
    notes: [{"name": "Black currant", "layer": "top"}, {"name": "Orange", "layer": "top"}, {"name": "Citron", "layer": "top"}, {"name": "Mint", "layer": "top"}, {"name": "Coriander", "layer": "top"}, {"name": "Grapefruit", "layer": "top"}, {"name": "Apricot", "layer": "heart"}, {"name": "Basil", "layer": "heart"}, {"name": "Rose", "layer": "heart"}, {"name": "Violet Leaf", "layer": "heart"}, {"name": "Fig", "layer": "base"}, {"name": "Dates", "layer": "base"}, {"name": "Ambrette", "layer": "base"}, {"name": "Amberwood", "layer": "base"}],
  },
];
