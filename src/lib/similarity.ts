export type LayeredNotes = {
  top: string[];
  heart: string[];
  base: string[];
};

export type SharedNote = {
  name: string;
  sameLayer: boolean;
};

export type SimilarityResult = {
  score: number;
  shared: SharedNote[];
  onlyOriginal: string[];
  onlyAlternative: string[];
};

const LAYERS = ["top", "heart", "base"] as const;

export function computeSimilarityScore(
  a: LayeredNotes,
  b: LayeredNotes,
): SimilarityResult {
  const mapA = new Map<string, (typeof LAYERS)[number]>();
  const mapB = new Map<string, (typeof LAYERS)[number]>();

  for (const layer of LAYERS) {
    for (const note of a[layer]) {
      if (!mapA.has(note.toLowerCase())) mapA.set(note.toLowerCase(), layer);
    }
    for (const note of b[layer]) {
      if (!mapB.has(note.toLowerCase())) mapB.set(note.toLowerCase(), layer);
    }
  }

  const shared: SharedNote[] = [];
  for (const [key, layerA] of mapA) {
    const layerB = mapB.get(key);
    if (layerB) {
      const original = a[layerA].find((n) => n.toLowerCase() === key) ?? key;
      shared.push({ name: original, sameLayer: layerA === layerB });
    }
  }

  const onlyOriginal: string[] = [];
  for (const [key, layerA] of mapA) {
    if (!mapB.has(key)) {
      onlyOriginal.push(a[layerA].find((n) => n.toLowerCase() === key) ?? key);
    }
  }
  const onlyAlternative: string[] = [];
  for (const [key, layerB] of mapB) {
    if (!mapA.has(key)) {
      onlyAlternative.push(b[layerB].find((n) => n.toLowerCase() === key) ?? key);
    }
  }

  const sharedWeighted = shared.reduce((sum, s) => sum + (s.sameLayer ? 2 : 1), 0);
  const maxNotes = Math.max(mapA.size, mapB.size);
  const maxWeight = maxNotes * 2;
  const score =
    maxWeight > 0 ? Math.min(100, Math.round((sharedWeighted / maxWeight) * 100)) : 0;

  shared.sort((x, y) => Number(y.sameLayer) - Number(x.sameLayer));
  return { score, shared, onlyOriginal, onlyAlternative };
}
