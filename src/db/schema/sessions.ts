import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { attendanceStatusEnum, occurrenceStatusEnum, sessionStatusEnum, sessionTypeEnum } from "./enums";
import { users } from "./users";
import { connections } from "./connections";
import { chaburas } from "./chaburas";
import { subjects } from "./subjects";
import { calls } from "./calls";

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
    callId: uuid("call_id")
      .references(() => calls.id, { onDelete: "set null" }),
    meetUrl: text("meet_url"),
    notes: text("notes"),
    actualStartedAt: timestamp("actual_started_at", { withTimezone: true, mode: "date" }),
    actualEndedAt: timestamp("actual_ended_at", { withTimezone: true, mode: "date" }),
    actualDurationMin: integer("actual_duration_min"),
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
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
    participants: many(sessionParticipants),
  }),
);

export const sessionOccurrencesRelations = relations(
  sessionOccurrences,
  ({ one, many }) => ({
    session: one(learningSessions, {
      fields: [sessionOccurrences.sessionId],
      references: [learningSessions.id],
    }),
    call: one(calls, {
      fields: [sessionOccurrences.callId],
      references: [calls.id],
    }),
    participants: many(sessionOccurrenceParticipants),
  }),
);

/* ------------------------------------------------------------------ */
/*  session_participants                                               */
/* ------------------------------------------------------------------ */
export const sessionParticipants = pgTable(
  "session_participants",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => learningSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.userId] })],
);

/* ------------------------------------------------------------------ */
/*  session_occurrence_participants                                    */
/* ------------------------------------------------------------------ */
export const sessionOccurrenceParticipants = pgTable(
  "session_occurrence_participants",
  {
    occurrenceId: uuid("occurrence_id")
      .notNull()
      .references(() => sessionOccurrences.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status"),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" }),
    leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
    minutesAttended: integer("minutes_attended"),
    subjectId: uuid("subject_id").references(() => subjects.id),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.occurrenceId, t.userId] })],
);

/* ------------------------------------------------------------------ */
/*  New table relations                                                */
/* ------------------------------------------------------------------ */
export const sessionParticipantsRelations = relations(
  sessionParticipants,
  ({ one }) => ({
    session: one(learningSessions, {
      fields: [sessionParticipants.sessionId],
      references: [learningSessions.id],
    }),
    user: one(users, {
      fields: [sessionParticipants.userId],
      references: [users.id],
    }),
  }),
);

export const sessionOccurrenceParticipantsRelations = relations(
  sessionOccurrenceParticipants,
  ({ one }) => ({
    occurrence: one(sessionOccurrences, {
      fields: [sessionOccurrenceParticipants.occurrenceId],
      references: [sessionOccurrences.id],
    }),
    user: one(users, {
      fields: [sessionOccurrenceParticipants.userId],
      references: [users.id],
    }),
    subject: one(subjects, {
      fields: [sessionOccurrenceParticipants.subjectId],
      references: [subjects.id],
    }),
  }),
);
