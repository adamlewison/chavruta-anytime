"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/db";
import { users, accounts, verificationTokens } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resend, RESEND_FROM } from "@/lib/email";
import { generateCode, encodeToken, verifyToken } from "@/domain/token";

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  darkMode?: boolean;
  profileVisible?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.country !== undefined) updates.country = data.country;
    if (data.timezone !== undefined) updates.timezone = data.timezone;
    if (data.darkMode !== undefined) updates.darkMode = data.darkMode;
    if (data.profileVisible !== undefined) updates.profileVisible = data.profileVisible;

    await db()
      .update(users)
      .set(updates)
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("updateProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateAvailability(
  bitmapBase64: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const bytes = Buffer.from(bitmapBase64, "base64");
    if (bytes.length !== 42) {
      return { success: false, error: "Invalid availability data" };
    }

    await db()
      .update(users)
      .set({ availability: bytes, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("updateAvailability error:", error);
    return { success: false, error: "Failed to update availability" };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db().delete(users).where(eq(users.id, session.user.id));
  } catch (error) {
    console.error("deleteAccount error:", error);
    return { success: false, error: "Failed to delete account" };
  }
  await signOut({ redirectTo: "/" });
  redirect("/");
}

const EMAIL_CHANGE_TTL_MINUTES = 10;
const EMAIL_CHANGE_MAX_PER_HOUR = 5;

export async function sendEmailChangeCode(
  newEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const normalized = newEmail.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { success: false, error: "Invalid email address" };
    }

    const database = db();

    const [taken] = await database
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized));

    if (taken && taken.id !== session.user.id) {
      return { success: false, error: "That email is already in use" };
    }

    const identifier = `email-change:${normalized}`;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recent = await database
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          gt(verificationTokens.expires, oneHourAgo),
        ),
      );

    if (recent.length >= EMAIL_CHANGE_MAX_PER_HOUR) {
      return { success: false, error: "Too many requests. Try again later." };
    }

    const code = generateCode();
    const expires = new Date(now.getTime() + EMAIL_CHANGE_TTL_MINUTES * 60 * 1000);

    await database.insert(verificationTokens).values({
      identifier,
      token: encodeToken(code),
      expires,
    });

    await resend.emails.send({
      from: RESEND_FROM,
      to: normalized,
      subject: "Verify your new email — ChavrutaAnytime",
      text: `Your verification code is: ${code}\n\nThis code expires in ${EMAIL_CHANGE_TTL_MINUTES} minutes.\n\nIf you did not request this, you can ignore this email.`,
    });

    return { success: true };
  } catch (error) {
    console.error("sendEmailChangeCode error:", error);
    return { success: false, error: "Failed to send code" };
  }
}

export async function confirmEmailChange(
  newEmail: string,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    const normalized = newEmail.trim().toLowerCase();
    const identifier = `email-change:${normalized}`;
    const now = new Date();
    const database = db();

    const candidates = await database
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          gt(verificationTokens.expires, now),
        ),
      );

    const match = candidates.find((row) => verifyToken(code, row.token));
    if (!match) return { success: false, error: "Invalid or expired code" };

    await database
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, match.token),
        ),
      );

    // Re-check uniqueness at confirm time
    const [taken] = await database
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized));

    if (taken && taken.id !== session.user.id) {
      return { success: false, error: "That email is already in use" };
    }

    await database
      .update(users)
      .set({ email: normalized, emailVerified: new Date(), updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("confirmEmailChange error:", error);
    return { success: false, error: "Failed to update email" };
  }
}

export async function disconnectAccount(
  provider: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await db()
      .delete(accounts)
      .where(
        and(
          eq(accounts.userId, session.user.id),
          eq(accounts.provider, provider),
        ),
      );

    revalidatePath("/settings/accounts");
    return { success: true };
  } catch (error) {
    console.error("disconnectAccount error:", error);
    return { success: false, error: "Failed to disconnect account" };
  }
}
