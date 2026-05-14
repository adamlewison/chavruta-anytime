import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { occurrenceStatusEnum, sessionStatusEnum, sessionTypeEnum } from "./enums";
import { users } from "./users";
import { connections } from "./connections";
import { chaburas } from "./chaburas";
import { subjects } from "./subjects";

/* ------------------------------------------------------------------ */
/*  learning_sessions                                                 */
/* ------------------------------------------------------------------ */
export const learningSessions = pgTable("learning_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: sessionTypeEnum("type").notNull(),
  chavrutaPairId: uuid("chavruta_pair_id").references(() => connections.id),
  chaburaId: uuid("chabura_id").references(() => chaburas.id),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  title: text("title"),
  rrule: text("rrule"),
  dtstart: timestamp("dtstart", { withTimezone: true, mode: "date" }),
  durationMin: integer("duration_min"),
  timezone: text("timezone"),
  status: sessionStatusEnum("status").default("active").notNull(),
  meetUrl: text("meet_url"),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
});

/* ------------------------------------------------------------------ */
/*  session_occurrences                                               */
/* ------------------------------------------------------------------ */
export const sessionOccurrences = pgTable(
  "session_occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => learningSessions.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    status: occurrenceStatusEnum("status").default("scheduled").notNull(),
    meetUrl: text("meet_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
  },
  (t) => [
    unique("session_occurrences_session_starts").on(t.sessionId, t.startsAt),
    index("session_occurrences_session_id_idx").on(t.sessionId),
  ],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */
export const learningSessionsRelations = relations(
  learningSessions,
  ({ one, many }) => ({
    chavrutaPair: one(connections, {
      fields: [learningSessions.chavrutaPairId],
      references: [connections.id],
    }),
    chabura: one(chaburas, {
      fields: [learningSessions.chaburaId],
      references: [chaburas.id],
    }),
    subject: one(subjects, {
      fields: [learningSessions.subjectId],
      references: [subjects.id],
    }),
    createdBy: one(users, {
      fields: [learningSessions.createdById],
      references: [users.id],
    }),
    occurrences: many(sessionOccurrences),
  }),
);

export const sessionOccurrencesRelations = relations(
  sessionOccurrences,
  ({ one }) => ({
    session: one(learningSessions, {
      fields: [sessionOccurrences.sessionId],
      references: [learningSessions.id],
    }),
  }),
);
