import {
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { noteLayerEnum } from "./enums";
import { perfumes } from "./perfumes";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Join table. `layer` lives here (not on `notes`) because a note's position
 * in the olfactory pyramid depends on the perfume it appears in.
 */
export const perfumeNotes = pgTable(
  "perfume_notes",
  {
    perfumeId: integer("perfume_id")
      .notNull()
      .references(() => perfumes.id, { onDelete: "cascade" }),
    noteId: integer("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    layer: noteLayerEnum("layer").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.perfumeId, t.noteId] }),
    index("perfume_notes_note_idx").on(t.noteId),
    index("perfume_notes_layer_idx").on(t.layer),
  ]
);
