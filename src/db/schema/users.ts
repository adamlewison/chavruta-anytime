import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { genderEnum } from "./enums";

/* ------------------------------------------------------------------ */
/*  Custom bytea type for availability bitmap                         */
/* ------------------------------------------------------------------ */
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/* ------------------------------------------------------------------ */
/*  users – NextAuth-compatible + extended fields                     */
/* ------------------------------------------------------------------ */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", {
    withTimezone: true,
    mode: "date",
  }),
  name: text("name"),
  bio: text("bio"),
  image: text("image"),
  gender: genderEnum("gender"),
  country: text("country"),
  postCode: text("post_code"),
  languages: text("languages").array(),
  timezone: text("timezone"),
  availability: bytea("availability"),
  onboardedAt: timestamp("onboarded_at", {
    withTimezone: true,
    mode: "date",
  }),
  darkMode: boolean("dark_mode").default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .$defaultFn(() => new Date()),
});

/* ------------------------------------------------------------------ */
/*  accounts – NextAuth adapter standard                              */
/* ------------------------------------------------------------------ */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

/* ------------------------------------------------------------------ */
/*  auth_sessions – NextAuth adapter (renamed to avoid collision)     */
/* ------------------------------------------------------------------ */
export const authSessions = pgTable("auth_sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

/* ------------------------------------------------------------------ */
/*  verification_tokens – NextAuth adapter standard                   */
/* ------------------------------------------------------------------ */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ------------------------------------------------------------------ */
/*  Relations                                                         */
/* ------------------------------------------------------------------ */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  authSessions: many(authSessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));
