import { z } from "zod";
import { countryCode, optionalText, text, timezone } from "./common";

/** updateProfile(data) — every field optional; a no-op call is legal. */
export const updateProfileSchema = z.object({
  name: text(100).optional(),
  bio: optionalText(280).optional(),
  country: countryCode.optional(),
  timezone: timezone.optional(),
  darkMode: z.boolean().optional(),
  profileVisible: z.boolean().optional(),
});

/** updateAvailability(bitmapBase64) — 42 bytes base64-encoded. */
export const updateAvailabilitySchema = z
  .string()
  .base64()
  .refine((v) => {
    const bytes = Buffer.from(v, "base64").length;
    return bytes === 42;
  }, "Availability bitmap must decode to exactly 42 bytes");

/** sendEmailChangeCode(newEmail) */
export const sendEmailChangeCodeSchema = z.email().max(254);

/** confirmEmailChange(newEmail, code) */
export const confirmEmailChangeSchema = z.object({
  newEmail: z.email().max(254),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** disconnectAccount(provider) */
export const disconnectAccountSchema = z.string().min(1).max(40);
