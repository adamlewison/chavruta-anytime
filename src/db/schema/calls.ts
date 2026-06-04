import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const callStatusEnum = pgEnum("call_status", ["active", "ended"]);

export const calls = pgTable("calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomName: text("room_name").notNull().unique(),
  startedBy: uuid("started_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: callStatusEnum("status").notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
  endedAt: timestamp("ended_at", { withTimezone: true, mode: "date" }),
});

export const callParticipants = pgTable("call_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  callId: uuid("call_id")
    .notNull()
    .references(() => calls.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
  leftAt: timestamp("left_at", { withTimezone: true, mode: "date" }),
});

export const callsRelations = relations(calls, ({ one, many }) => ({
  startedBy: one(users, {
    fields: [calls.startedBy],
    references: [users.id],
  }),
  participants: many(callParticipants),
}));

export const callParticipantsRelations = relations(callParticipants, ({ one }) => ({
  call: one(calls, {
    fields: [callParticipants.callId],
    references: [calls.id],
  }),
  user: one(users, {
    fields: [callParticipants.userId],
    references: [users.id],
  }),
}));
