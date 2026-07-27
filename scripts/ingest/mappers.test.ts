import { describe, it, expect } from 'vitest';

import {
  decodeEntities,
  extractDescription,
  inferBrandType,
  inferConcentration,
  mapFamily,
  mapGender,
  mapLayer,
  slugify,
} from './mappers';
import type { FragDbAccord } from './types';

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('Light Blue')).toBe('light-blue');
  });

  it('strips accents and punctuation', () => {
    expect(slugify('O Boticário')).toBe('o-boticario');
    expect(slugify('Dolce&Gabbana')).toBe('dolce-gabbana');
  });

  it('keeps raw note ids intact', () => {
    expect(slugify('n2415')).toBe('n2415');
  });
});

describe('decodeEntities', () => {
  it('decodes named entities', () => {
    expect(decodeEntities('Dolce&amp;Gabbana')).toBe('Dolce&Gabbana');
    expect(decodeEntities('a&nbsp;b')).toBe('a b');
  });

  it('decodes numeric entities', () => {
    expect(decodeEntities('caf&#233;')).toBe('café');
  });
});

describe('mapGender', () => {
  it('maps explicit labels', () => {
    expect(mapGender('gender_for_women', {})).toBe('female');
    expect(mapGender('gender_for_men', {})).toBe('male');
    expect(mapGender('gender_for_women_and_men', {})).toBe('unisex');
  });

  it('does not let "women" match the "men" branch', () => {
    expect(mapGender('gender_for_women', {})).not.toBe('male');
  });

  it('falls back to distribution when label is empty', () => {
    const femaleHeavy = {
      gvotes_female: { count: 3600, percentage: 37 },
      gvotes_more_female: { count: 2600, percentage: 27 },
      gvotes_unisex: { count: 3300, percentage: 34 },
      gvotes_more_male: { count: 100, percentage: 1 },
      gvotes_male: { count: 100, percentage: 1 },
    };
    expect(mapGender('', femaleHeavy)).toBe('female');
  });

  it('returns unisex when distribution is balanced or absent', () => {
    expect(mapGender('', {})).toBe('unisex');
    expect(
      mapGender('', {
        gvotes_female: { count: 100, percentage: 50 },
        gvotes_male: { count: 100, percentage: 50 },
      }),
    ).toBe('unisex');
  });
});

describe('inferConcentration', () => {
  it('detects edp / edt / extrait / parfum from the name', () => {
    expect(inferConcentration('Bleu de Chanel Eau de Parfum')).toBe('edp');
    expect(inferConcentration('Sauvage Eau de Toilette')).toBe('edt');
    expect(inferConcentration('Noir Extrait')).toBe('extrait');
    expect(inferConcentration('Pure Parfum')).toBe('parfum');
  });

  it('does not misclassify "Eau de Parfum" as parfum', () => {
    expect(inferConcentration('Eau de Parfum')).toBe('edp');
  });

  it('defaults to edp when no signal is present', () => {
    expect(inferConcentration('Light Blue')).toBe('edp');
  });
});

describe('mapFamily', () => {
  const accord = (name: string, intensity: number): FragDbAccord => ({
    id: name,
    name,
    color: null,
    intensity,
  });

  it('maps the dominant resolvable accord to a family', () => {
    expect(mapFamily([accord('citrus', 100), accord('woody', 75)])).toBe('fresh');
    expect(mapFamily([accord('woody', 100)])).toBe('woody');
    expect(mapFamily([accord('floral', 100)])).toBe('floral');
    expect(mapFamily([accord('sweet', 100)])).toBe('gourmand');
    expect(mapFamily([accord('amber', 100)])).toBe('oriental');
  });

  it('ignores unresolved accord ids and uses the next resolvable one', () => {
    expect(mapFamily([accord('a33', 99), accord('citrus', 80)])).toBe('fresh');
  });

  it('defaults to oriental when nothing resolves', () => {
    expect(mapFamily([accord('a33', 99)])).toBe('oriental');
    expect(mapFamily([])).toBe('oriental');
  });
});

describe('mapLayer', () => {
  it('maps pyramid layers to DB layers', () => {
    expect(mapLayer('top')).toBe('top');
    expect(mapLayer('middle')).toBe('heart');
    expect(mapLayer('base')).toBe('base');
  });
});

describe('inferBrandType', () => {
  it('flags Arabic houses by keyword', () => {
    expect(inferBrandType('Lattafa', 'United Arab Emirates')).toBe('arabic');
    expect(inferBrandType('Arabian Oud', null)).toBe('arabic');
  });

  it('flags by country when the house name is not recognized', () => {
    expect(inferBrandType('Maison Kuwait', 'Kuwait')).toBe('arabic');
  });

  it('defaults international houses to designer', () => {
    expect(inferBrandType('Guerlain', 'France')).toBe('designer');
  });
});

describe('extractDescription', () => {
  it('decodes entities and collapses whitespace', () => {
    expect(extractDescription('Light Blue by Dolce&amp;Gabbana.')).toBe(
      'Light Blue by Dolce&Gabbana.',
    );
    expect(extractDescription('a   b')).toBe('a b');
  });

  it('returns null for empty input', () => {
    expect(extractDescription(null)).toBeNull();
    expect(extractDescription('   ')).toBeNull();
  });
});
