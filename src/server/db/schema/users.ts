import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums";

/**
 * Users table — shaped to be compatible with Better Auth (text id, email,
 * emailVerified, image) plus the extra fields this product needs.
 *
 * The Auth subsystem will add `session`, `account`, and `verification`
 * tables later; this table is ready for Better Auth to adopt as-is.
 */
export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("user"),
    preferences: jsonb("preferences").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)]
);
