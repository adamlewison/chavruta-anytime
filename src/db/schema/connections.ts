import { relations, sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { connectionStatusEnum } from "./enums";
import { users } from "./users";

/* ------------------------------------------------------------------ */
/*  connections                                                       */
/* ------------------------------------------------------------------ */
export const connections = pgTable(
  "connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: connectionStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
    respondedAt: timestamp("responded_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (t) => [
    unique("connections_pair_unique").on(t.requesterId, t.addresseeId),
    check(
      "connections_no_self",
      sql`${t.requesterId} <> ${t.addresseeId}`,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */
export const connectionsRelations = relations(connections, ({ one }) => ({
  requester: one(users, {
    fields: [connections.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  addressee: one(users, {
    fields: [connections.addresseeId],
    references: [users.id],
    relationName: "addressee",
  }),
}));
