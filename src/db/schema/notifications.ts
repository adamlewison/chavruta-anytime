import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { notificationChannelEnum, notificationTypeEnum } from "./enums";
import { users } from "./users";

/* ------------------------------------------------------------------ */
/*  notifications                                                     */
/* ------------------------------------------------------------------ */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    payload: jsonb("payload"),
    readAt: timestamp("read_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("notifications_user_unread_idx")
      .on(t.userId, t.createdAt)
      .where(sql`${t.readAt} IS NULL`),
  ],
);

/* ------------------------------------------------------------------ */
/*  user_notification_settings                                        */
/* ------------------------------------------------------------------ */
// Missing row = enabled (sparse / "default allowed" strategy)
export const userNotificationSettings = pgTable(
  "user_notification_settings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .$defaultFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.type, t.channel] }),
  ],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */
export const userNotificationSettingsRelations = relations(
  userNotificationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [userNotificationSettings.userId],
      references: [users.id],
    }),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
