import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { currencyEnum } from "./enums";
import { perfumes } from "./perfumes";

/**
 * Directed relationship: Original perfume → cheaper/similar Alternative.
 */
export const alternatives = pgTable(
  "alternatives",
  {
    originalId: integer("original_id")
      .notNull()
      .references(() => perfumes.id, { onDelete: "cascade" }),
    alternativeId: integer("alternative_id")
      .notNull()
      .references(() => perfumes.id, { onDelete: "cascade" }),
    similarityScore: real("similarity_score").notNull(), // 0–100
    priceOriginal: integer("price_original"),
    priceAlternative: integer("price_alternative"),
    currency: currencyEnum("currency").notNull().default("usd"),
    similarityExplanation: text("similarity_explanation"),
    advantages: text("advantages").array(),
    disadvantages: text("disadvantages").array(),
    expertNotes: text("expert_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.originalId, t.alternativeId] }),
    // Reverse lookups: "which originals list perfume X as an alternative?"
    index("alternatives_alt_idx").on(t.alternativeId),
    index("alternatives_score_idx").on(t.similarityScore),
    check(
      "similarity_score_range",
      sql`${t.similarityScore} >= 0 AND ${t.similarityScore} <= 100`
    ),
    check("no_self_alternative", sql`${t.originalId} <> ${t.alternativeId}`),
  ]
);
