import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { perfumes } from "./perfumes";
import { users } from "./users";

export const reviews = pgTable(
  "reviews",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    perfumeId: integer("perfume_id")
      .notNull()
      .references(() => perfumes.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1–5
    longevity: integer("longevity"), // 0–10
    projection: integer("projection"), // 0–10
    sillage: integer("sillage"), // 0–10
    comment: text("comment"),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.perfumeId] }),
    index("reviews_perfume_idx").on(t.perfumeId),
    index("reviews_rating_idx").on(t.rating),
    check("rating_range", sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
    check(
      "longevity_range",
      sql`${t.longevity} IS NULL OR (${t.longevity} >= 0 AND ${t.longevity} <= 10)`
    ),
    check(
      "projection_range",
      sql`${t.projection} IS NULL OR (${t.projection} >= 0 AND ${t.projection} <= 10)`
    ),
    check(
      "sillage_range",
      sql`${t.sillage} IS NULL OR (${t.sillage} >= 0 AND ${t.sillage} <= 10)`
    ),
  ]
);
