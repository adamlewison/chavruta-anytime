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

function formatTime(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 || 12;
  return minute === 0
    ? `${h12}${ampm}`
    : `${h12}.${String(minute).padStart(2, "0")}${ampm}`;
}

export function describeSchedule(
  rruleStr: string | null,
  dtstart: Date | null,
  timezone: string | null,
): string | null {
  if (!rruleStr) return null;
  try {
    const rule = RRule.fromString(rruleStr);
    const opts = rule.options;

    let hour = 0;
    let minute = 0;
    const startDate = dtstart ?? opts.dtstart;
    if (startDate) {
      const dt = DateTime.fromJSDate(startDate).setZone(timezone ?? "UTC");
      hour = dt.hour;
      minute = dt.minute;
    }
    const timeStr = formatTime(hour, minute);

    const raw: Array<number | { weekday: number }> = (opts.byweekday as Array<number | { weekday: number }>) ?? [];
    const days = raw.map((d) => (typeof d === "number" ? d : d.weekday));

    if (days.length === 0) return null;

    if (days.length === 1) {
      const day = days[0];
      if (day === 4 && hour >= 15) return `Erev Shabbos ${timeStr}`;
      if (day === 5 && hour >= 20) return `Motzei Shabbas ${timeStr}`;
      const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return `${names[day]} ${timeStr}`;
    }

    const sorted = [...days].sort((a, b) => (a === 6 ? -1 : a) - (b === 6 ? -1 : b));
    const key = sorted.map((d) => (d === 6 ? -1 : d)).join(",");

    const PATTERNS: Record<string, string> = {
      "-1,0,1,2,3,4,5": "Daily",
      "-1,0,1,2,3,4": "Sun – Fri",
      "-1,0,1,2,3": "Sun – Thu",
      "0,1,2,3,4": "Weekdays",
      "0,1,2,3": "Mon – Thu",
      "1,2,3,4": "Tue – Fri",
    };
    if (PATTERNS[key]) return `${PATTERNS[key]} ${timeStr}`;

    const abbr = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    const dayList = sorted.map((d) => abbr[d === 6 ? 6 : d]).join(", ");
    return `${dayList} ${timeStr}`;
  } catch {
    return null;
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
