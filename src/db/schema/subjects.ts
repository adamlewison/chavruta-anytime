import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { subjectLevelEnum } from "./enums";
import { users } from "./users";

/* ------------------------------------------------------------------ */
/*  subjects                                                          */
/* ------------------------------------------------------------------ */
export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  hebrewName: text("hebrew_name"),
  description: text("description"),
  image: text("image"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
});

/* ------------------------------------------------------------------ */
/*  user_subjects (join table)                                        */
/* ------------------------------------------------------------------ */
export const userSubjects = pgTable(
  "user_subjects",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    level: subjectLevelEnum("level").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.userId, t.subjectId] })],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */
export const subjectsRelations = relations(subjects, ({ many }) => ({
  userSubjects: many(userSubjects),
}));

export const userSubjectsRelations = relations(userSubjects, ({ one }) => ({
  user: one(users, {
    fields: [userSubjects.userId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [userSubjects.subjectId],
    references: [subjects.id],
  }),
}));
