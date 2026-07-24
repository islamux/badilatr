import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { brandTypeEnum } from "./enums";

export const brands = pgTable(
  "brands",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    country: text("country"),
    foundedYear: integer("founded_year"),
    logo: text("logo"),
    description: text("description"),
    type: brandTypeEnum("type").notNull().default("arabic"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("brands_type_idx").on(t.type)]
);
