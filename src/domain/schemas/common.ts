import { z } from "zod";

/**
 * Shared primitives for Server Action input schemas.
 *
 * Every schema in this directory mirrors the *actual* TypeScript signature of
 * the action it guards, so a valid call parses to an identical object. They are
 * not aspirational — a schema that rejects input the app legitimately sends is
 * worse than no schema at all.
 */

export const uuid = z.uuid();

/** Non-empty, trimmed-length-checked free text. */
export const text = (max: number) => z.string().min(1).max(max);

/** Free text that may legitimately be empty (bios, notes, descriptions). */
export const optionalText = (max: number) => z.string().max(max);

/** ISO-8601 timestamp string, as produced by Date.prototype.toISOString(). */
export const isoDateTime = z.iso.datetime();

/** ISO 3166-1 alpha-2 country code. */
export const countryCode = z.string().length(2);

/** IANA timezone identifier, e.g. "America/New_York". */
export const timezone = z.string().min(1).max(64);

/** Pull the first human-readable message out of a failed parse. */
export function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
