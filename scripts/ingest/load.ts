import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { FragDbOutput } from './types';

export function defaultFragDbPath(): string {
  return path.resolve(process.cwd(), 'perfume_scraper/output/fragdb_data.json');
}

export async function loadFragDb(
  filePath: string = defaultFragDbPath(),
): Promise<FragDbOutput> {
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as FragDbOutput;
}
