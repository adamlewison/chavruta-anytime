import { cache } from "react";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, authSessions, verificationTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { JWT } from "next-auth/jwt";
import { verifyToken } from "@/domain/token";

export const { auth, signIn, signOut, handlers } = NextAuth(() => {
  const database = db();
  return {
    adapter: DrizzleAdapter(database, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: authSessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "jwt" },
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
      Credentials({
        credentials: {
          email: { label: "Email", type: "email" },
          code: { label: "Code", type: "text" },
        },
        async authorize(credentials) {
          const email = (credentials?.email as string)?.trim().toLowerCase();
          const code = credentials?.code as string;

          if (!email || !code) return null;

          const database = db();
          const now = new Date();

          // Fetch all unexpired tokens for this email, then verify by hashing
          const candidates = await database
            .select()
            .from(verificationTokens)
            .where(
              and(
                eq(verificationTokens.identifier, email),
                gt(verificationTokens.expires, now),
              ),
            );

          const match = candidates.find((row) => verifyToken(code, row.token));

          if (!match) return null;

          // Delete used token
          await database
            .delete(verificationTokens)
            .where(
              and(
                eq(verificationTokens.identifier, email),
                eq(verificationTokens.token, match.token),
              ),
            );

          // Find or create user
          const [existing] = await database
            .select()
            .from(users)
            .where(eq(users.email, email));

          if (existing)
            return {
              id: existing.id,
              email: existing.email,
              name: existing.name,
            };

          const [created] = await database
            .insert(users)
            .values({ email, emailVerified: now })
            .returning();

          return { id: created.id, email: created.email, name: created.name };
        },
      }),
    ],
    pages: {
      signIn: "/sign-in",
      verifyRequest: "/verify",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user?.id) {
          token.sub = user.id;
        }
        // Always refresh onboardedAt so session reflects current DB state
        if (token.sub) {
          const [dbUser] = await database
            .select({ onboardedAt: users.onboardedAt, image: users.image })
            .from(users)
            .where(eq(users.id, token.sub as string));
          token.onboardedAt = dbUser?.onboardedAt?.toISOString() ?? null;
          token.picture = dbUser?.image ?? token.picture;
        }
        return token;
      },
      session({ session, token }) {
        if (token.sub && session.user) {
          session.user.id = token.sub;
        }
        session.user.onboardedAt = (token.onboardedAt as string) ?? null;

        return session;
      },
    },
  };
});

export const getSession = cache(auth);
