import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { chaburaMemberRoleEnum } from "./enums";
import { users } from "./users";

/* ------------------------------------------------------------------ */
/*  chaburas                                                          */
/* ------------------------------------------------------------------ */
export const chaburas = pgTable("chaburas", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roshChaburaId: uuid("rosh_chabura_id")
    .references(() => users.id),
  isPublic: boolean("is_public").default(true),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
});

/* ------------------------------------------------------------------ */
/*  chabura_members                                                   */
/* ------------------------------------------------------------------ */
export const chaburaMembers = pgTable(
  "chabura_members",
  {
    chaburaId: uuid("chabura_id")
      .notNull()
      .references(() => chaburas.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: chaburaMemberRoleEnum("role").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.chaburaId, t.userId] })],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */
export const chaburasRelations = relations(chaburas, ({ one, many }) => ({
  creator: one(users, {
    fields: [chaburas.creatorId],
    references: [users.id],
    relationName: "chaburaCreator",
  }),
  roshChabura: one(users, {
    fields: [chaburas.roshChaburaId],
    references: [users.id],
    relationName: "roshChabura",
  }),
  members: many(chaburaMembers),
}));

export const chaburaMembersRelations = relations(
  chaburaMembers,
  ({ one }) => ({
    chabura: one(chaburas, {
      fields: [chaburaMembers.chaburaId],
      references: [chaburas.id],
    }),
    user: one(users, {
      fields: [chaburaMembers.userId],
      references: [users.id],
    }),
  }),
);
