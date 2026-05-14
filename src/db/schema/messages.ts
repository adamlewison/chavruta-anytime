import { relations, sql } from "drizzle-orm";
import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { conversationTypeEnum } from "./enums";
import { chaburas } from "./chaburas";
import { users } from "./users";

/* ------------------------------------------------------------------ */
/*  conversations                                                     */
/* ------------------------------------------------------------------ */
export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: conversationTypeEnum("type").notNull(),
  chaburaId: uuid("chabura_id").references(() => chaburas.id),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
});

/* ------------------------------------------------------------------ */
/*  conversation_members                                              */
/* ------------------------------------------------------------------ */
export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (t) => [primaryKey({ columns: [t.conversationId, t.userId] })],
);

/* ------------------------------------------------------------------ */
/*  messages                                                          */
/* ------------------------------------------------------------------ */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
    editedAt: timestamp("edited_at", { withTimezone: true, mode: "date" }),
  },
  (t) => [
    index("messages_conversation_created_idx").on(t.conversationId, t.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */
export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    chabura: one(chaburas, {
      fields: [conversations.chaburaId],
      references: [chaburas.id],
    }),
    members: many(conversationMembers),
    messages: many(messages),
  }),
);

export const conversationMembersRelations = relations(
  conversationMembers,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationMembers.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationMembers.userId],
      references: [users.id],
    }),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));
