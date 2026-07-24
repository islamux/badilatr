import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * Lazy DB singleton.
 *
 * We resolve `DATABASE_URL` on first use rather than at import time so that
 * builds, type-checking, and CI don't crash when the database isn't wired up.
 */
let _db: NeonHttpDatabase<typeof schema> | undefined;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and paste your Neon connection string."
    );
  }

  _db = drizzle(neon(url), { schema });
  return _db;
}

export type DB = NeonHttpDatabase<typeof schema>;
