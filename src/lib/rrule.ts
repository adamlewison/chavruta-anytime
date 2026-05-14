import { RRule } from "rrule";
import { DateTime } from "luxon";

/**
 * Convert an RRULE to a human-readable description
 */
export function rruleToText(rruleString: string): string {
  try {
    const rule = RRule.fromString(rruleString);
    return rule.toText();
  } catch {
    return "Custom schedule";
  }
}

/**
 * Get the next N occurrences of an RRULE after a given date
 */
export function getNextOccurrences(
  rruleString: string,
  after: Date = new Date(),
  count: number = 12
): Date[] {
  try {
    const rule = RRule.fromString(rruleString);
    return rule
      .between(after, new Date(after.getTime() + 365 * 24 * 60 * 60 * 1000), true)
      .slice(0, count);
  } catch {
    return [];
  }
}

/**
 * Format a date in a user's timezone
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  format: string = "EEE, MMM d 'at' h:mm a"
): string {
  return DateTime.fromJSDate(date).setZone(timezone).toFormat(format);
}
