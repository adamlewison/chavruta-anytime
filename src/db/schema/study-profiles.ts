import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { subjects } from "./subjects";
import { users } from "./users";

export const studyProfiles = pgTable(
  "study_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "no action" }),
    availabilityLocal: text("availability_local").notNull(),
    availabilityUtc: text("availability_utc").notNull(),
    notes: text("notes"),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("study_profiles_match_idx").on(t.subjectId, t.active),
    index("study_profiles_user_idx").on(t.userId),
  ],
);

export const studyProfilesRelations = relations(studyProfiles, ({ one }) => ({
  user: one(users, {
    fields: [studyProfiles.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [studyProfiles.subjectId],
    references: [subjects.id],
  }),
}));
