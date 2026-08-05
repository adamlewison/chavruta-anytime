"use server";

import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { resend, RESEND_FROM } from "@/server/email";
import { eq, and, gt } from "drizzle-orm";
import { generateCode, encodeToken } from "@/domain/token";

const CODE_TTL_MINUTES = 10;
const MAX_SENDS_PER_HOUR = 5;

export async function sendPasscode(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = email.trim().toLowerCase();

    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { success: false, error: "Invalid email address" };
    }

    const database = db();
    const now = new Date();

    // Rate-limit: max 5 sends per email per hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentSends = await database
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, normalized),
          gt(verificationTokens.expires, oneHourAgo),
        ),
      );

    if (recentSends.length >= MAX_SENDS_PER_HOUR) {
      return {
        success: false,
        error: "Too many code requests. Please try again later.",
      };
    }

    const code = generateCode();
    const expires = new Date(now.getTime() + CODE_TTL_MINUTES * 60 * 1000);

    await database.insert(verificationTokens).values({
      identifier: normalized,
      token: encodeToken(code),
      expires,
    });

    await resend.emails.send({
      from: RESEND_FROM,
      to: normalized,
      subject: "Your ChavrutaAnytime sign-in code",
      text: `Your sign-in code is: ${code}\n\nThis code expires in ${CODE_TTL_MINUTES} minutes.`,
    });

    return { success: true };
  } catch (error) {
    console.error("sendPasscode error:", error);
    return { success: false, error: "Failed to send passcode" };
  }
}
