import { relations } from "drizzle-orm";

import { alternatives } from "./alternatives";
import { brands } from "./brands";
import { notes, perfumeNotes } from "./notes";
import { perfumes } from "./perfumes";
import { reviews } from "./reviews";
import { users } from "./users";

export const brandRelations = relations(brands, ({ many }) => ({
  perfumes: many(perfumes),
}));

export const perfumeRelations = relations(perfumes, ({ one, many }) => ({
  brand: one(brands, {
    fields: [perfumes.brandId],
    references: [brands.id],
  }),
  notes: many(perfumeNotes),
  reviews: many(reviews),
  // An alternative row references two perfumes; disambiguate with relationName.
  alternativesAsOriginal: many(alternatives, { relationName: "original" }),
  alternativesAsAlternative: many(alternatives, {
    relationName: "alternative",
  }),
}));

export const noteRelations = relations(notes, ({ many }) => ({
  perfumes: many(perfumeNotes),
}));

export const perfumeNoteRelations = relations(perfumeNotes, ({ one }) => ({
  perfume: one(perfumes, {
    fields: [perfumeNotes.perfumeId],
    references: [perfumes.id],
  }),
  note: one(notes, {
    fields: [perfumeNotes.noteId],
    references: [notes.id],
  }),
}));

export const alternativeRelations = relations(alternatives, ({ one }) => ({
  original: one(perfumes, {
    fields: [alternatives.originalId],
    references: [perfumes.id],
    relationName: "original",
  }),
  alternative: one(perfumes, {
    fields: [alternatives.alternativeId],
    references: [perfumes.id],
    relationName: "alternative",
  }),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  perfume: one(perfumes, {
    fields: [reviews.perfumeId],
    references: [perfumes.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
}));
