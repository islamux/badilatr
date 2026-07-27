export type Gender = 'male' | 'female' | 'unisex';
export type Concentration = 'edt' | 'edp' | 'parfum' | 'extrait';
export type Family = 'woody' | 'oriental' | 'fresh' | 'floral' | 'gourmand';
export type Layer = 'top' | 'heart' | 'base';
export type BrandType = 'arabic' | 'designer' | 'niche';
export type PyramidLayer = 'top' | 'middle' | 'base';

export type FragDbGenderDistribution = Record<
  string,
  { count: number; percentage: number }
>;

export interface FragDbAccord {
  id: string;
  name: string;
  color: string | null;
  intensity: number;
}

export interface FragDbPyramidNote {
  id: string;
  name: string;
  opacity: string | null;
  weight: string | null;
}

export interface FragDbPerfume {
  pid: string;
  name: string;
  brand: string | null;
  brand_country: string | null;
  brand_logo: string | null;
  perfumer: string | null;
  year: number | null;
  description: string | null;
  gender: { label: string; distribution: FragDbGenderDistribution };
  accords: FragDbAccord[];
  notes: Record<PyramidLayer, FragDbPyramidNote[]>;
  image_urls: string[];
}

export interface FragDbBrandRow {
  id: string;
  name: string;
  country: string | null;
  website: string | null;
  parent_company: string | null;
  logo: string | null;
}

export interface FragDbNoteRow {
  id: string;
  name: string;
  group?: string | null;
}

export interface FragDbOutput {
  source: 'fragdb';
  total_count: number;
  perfumes: FragDbPerfume[];
  brands: FragDbBrandRow[];
  notes: FragDbNoteRow[];
  accords: FragDbAccord[];
}
