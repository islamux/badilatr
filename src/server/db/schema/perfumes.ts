import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

import { brands } from "./brands";
import { concentrationEnum, fragranceFamilyEnum, genderEnum } from "./enums";

export const perfumes = pgTable(
  "perfumes",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    releaseYear: integer("release_year"),
    perfumer: text("perfumer"),
    gender: genderEnum("gender").notNull(),
    concentration: concentrationEnum("concentration").notNull(),
    fragranceFamily: fragranceFamilyEnum("fragrance_family").notNull(),
    description: text("description"),
    image: text("image"),
    /**
     * Scent-profile embedding. Populated by the Matching subsystem;
     * nullable until then. Dimensions match OpenAI text-embedding-3-small.
     * A matching IVFFlat index is added via raw SQL in the migrations.
     */
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("perfumes_brand_idx").on(t.brandId),
    index("perfumes_family_idx").on(t.fragranceFamily),
    index("perfumes_gender_idx").on(t.gender),
  ]
);
