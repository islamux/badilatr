import type {
  BrandType,
  Concentration,
  Family,
  FragDbAccord,
  FragDbGenderDistribution,
  Gender,
  Layer,
  PyramidLayer,
} from './types';

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&nbsp;': ' ',
  '&#39;': "'",
  '&quot;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&ndash;': '-',
  '&mdash;': '-',
  '&rsquo;': "'",
  '&lsquo;': "'",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&[a-zA-Z]+;/g, (m) => NAMED_ENTITIES[m] ?? m);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mapGender(
  label: string,
  distribution: FragDbGenderDistribution,
): Gender {
  const labelKey = label.toLowerCase();
  if (labelKey.includes('women_and_men') || labelKey.includes('unisex')) return 'unisex';
  if (labelKey.includes('women') || labelKey.includes('female')) return 'female';
  if (labelKey.includes('men') || labelKey.includes('male')) return 'male';

  const female =
    (distribution.gvotes_female?.count ?? 0) +
    (distribution.gvotes_more_female?.count ?? 0);
  const male =
    (distribution.gvotes_male?.count ?? 0) +
    (distribution.gvotes_more_male?.count ?? 0);

  if (female > 0 && female >= male * 1.5) return 'female';
  if (male > 0 && male >= female * 1.5) return 'male';
  return 'unisex';
}

export function inferConcentration(name: string): Concentration {
  const paddedName = ` ${name.toLowerCase()} `;
  if (paddedName.includes('extrait')) return 'extrait';
  if (paddedName.includes('eau de parfum') || paddedName.includes(' edp ')) return 'edp';
  if (paddedName.includes('eau de toilette') || paddedName.includes(' edt ')) return 'edt';
  if (paddedName.includes('parfum')) return 'parfum';
  return 'edp';
}

const ACCORD_FAMILY: Record<string, Family> = {
  citrus: 'fresh',
  fresh: 'fresh',
  aquatic: 'fresh',
  watery: 'fresh',
  aromatic: 'fresh',
  'fresh spicy': 'fresh',
  green: 'fresh',
  floral: 'floral',
  powdery: 'floral',
  rose: 'floral',
  'white flowers': 'floral',
  sweet: 'gourmand',
  vanilla: 'gourmand',
  gourmand: 'gourmand',
  caramel: 'gourmand',
  honey: 'gourmand',
  chocolate: 'gourmand',
  amber: 'oriental',
  'warm spicy': 'oriental',
  musky: 'oriental',
  oriental: 'oriental',
  spicy: 'oriental',
  incense: 'oriental',
  woody: 'woody',
  sandalwood: 'woody',
  smoky: 'woody',
  leather: 'woody',
  patchouli: 'woody',
  vetiver: 'woody',
};

export function mapFamily(accords: FragDbAccord[]): Family {
  const sorted = [...accords].sort((a, b) => b.intensity - a.intensity);
  for (const accord of sorted) {
    const family = ACCORD_FAMILY[accord.name.toLowerCase()];
    if (family) return family;
  }
  return 'oriental';
}

export function mapLayer(layer: PyramidLayer): Layer {
  return layer === 'middle' ? 'heart' : layer;
}

const ARABIC_HOUSE_KEYWORDS = [
  'lattafa',
  'ard al zaafaran',
  'arabian oud',
  'rasasi',
  'al haramain',
  'haramain',
  'ajmal',
  'swiss arabian',
  'abdul samad',
  'afnan',
  'armaf',
  'ibraq',
  'al rehab',
  'khaltat',
  'asdaq',
  'deyrel',
];

const ARAB_COUNTRIES = new Set([
  'saudi arabia',
  'united arab emirates',
  'uae',
  'emirates',
  'kuwait',
  'qatar',
  'bahrain',
  'oman',
  'egypt',
  'lebanon',
  'jordan',
  'morocco',
  'algeria',
  'tunisia',
  'iraq',
  'syria',
  'yemen',
]);

export function inferBrandType(name: string, country: string | null): BrandType {
  const nameKey = name.toLowerCase();
  if (ARABIC_HOUSE_KEYWORDS.some((kw) => nameKey.includes(kw))) return 'arabic';
  if (country && ARAB_COUNTRIES.has(country.toLowerCase())) return 'arabic';
  return 'designer';
}

export function extractDescription(description: string | null): string | null {
  if (!description) return null;
  const cleaned = decodeEntities(description).replace(/\s+/g, ' ').trim();
  return cleaned || null;
}
