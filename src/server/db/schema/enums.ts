import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "moderator",
  "user",
]);

export const brandTypeEnum = pgEnum("brand_type", [
  "arabic",
  "designer",
  "niche",
]);

export const genderEnum = pgEnum("gender", ["male", "female", "unisex"]);

export const concentrationEnum = pgEnum("concentration", [
  "edt",
  "edp",
  "parfum",
  "extrait",
]);

export const fragranceFamilyEnum = pgEnum("fragrance_family", [
  "woody",
  "oriental",
  "fresh",
  "floral",
  "gourmand",
]);

/**
 * A note's layer (top / heart / base) belongs to the perfume-note
 * relationship, not the note itself — the same ingredient can sit in the
 * top of one fragrance and the base of another. This is an intentional
 * improvement over the original spec, which put category on `notes`.
 */
export const noteLayerEnum = pgEnum("note_layer", ["top", "heart", "base"]);

export const currencyEnum = pgEnum("currency", ["usd", "sar", "aed", "egp"]);
