import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import {
  rruleToText,
  getNextOccurrences,
  describeSchedule,
  formatInTimezone,
} from "./rrule";

/**
 * rrule weekday indices are Mon=0 … Sun=6, which is NOT the Sunday=0 convention
 * used by the availability bitmap. These tests pin that down deliberately —
 * it is the easiest thing in this module to get wrong.
 */

const utc = (iso: string) => DateTime.fromISO(iso, { zone: "utc" }).toJSDate();

describe("rruleToText", () => {
  it("renders a weekly rule in words", () => {
    expect(rruleToText("FREQ=WEEKLY;BYDAY=TU")).toContain("week");
  });

  it("falls back to a neutral label rather than throwing on garbage", () => {
    expect(rruleToText("not-an-rrule")).toBe("Custom schedule");
  });

  it("describes an empty string as 'every year' — RRule.fromString does not throw", () => {
    // Sharp edge, pinned deliberately: an empty rule is not rejected, it parses
    // to rrule's default (yearly). Callers must treat "" as absent themselves;
    // the "Custom schedule" fallback will not catch it.
    expect(rruleToText("")).toBe("every year");
  });
});

describe("getNextOccurrences", () => {
  it("returns occurrences on or after the anchor date", () => {
    const after = utc("2026-03-02T09:00:00"); // a Monday
    const out = getNextOccurrences("FREQ=WEEKLY;BYDAY=MO;DTSTART=20260302T090000Z", after, 4);
    expect(out.length).toBeGreaterThan(0);
    for (const d of out) expect(d.getTime()).toBeGreaterThanOrEqual(after.getTime());
  });

  it("never returns more than the requested count", () => {
    const after = utc("2026-03-02T09:00:00");
    const out = getNextOccurrences("FREQ=DAILY;DTSTART=20260302T090000Z", after, 5);
    expect(out).toHaveLength(5);
  });

  it("spaces weekly occurrences exactly seven days apart", () => {
    const after = utc("2026-03-02T09:00:00");
    const [a, b] = getNextOccurrences("FREQ=WEEKLY;BYDAY=MO;DTSTART=20260302T090000Z", after, 2);
    expect(b.getTime() - a.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("returns an empty array for an unparseable rule instead of throwing", () => {
    expect(getNextOccurrences("nonsense", utc("2026-03-02T09:00:00"), 5)).toEqual([]);
  });
});

describe("describeSchedule", () => {
  it("returns null when there is no rule", () => {
    expect(describeSchedule(null, utc("2026-03-03T21:00:00"), "UTC")).toBeNull();
  });

  it("returns null for an unparseable rule", () => {
    expect(describeSchedule("nonsense", utc("2026-03-03T21:00:00"), "UTC")).toBeNull();
  });

  it("returns null when the rule names no weekdays", () => {
    expect(describeSchedule("FREQ=DAILY", utc("2026-03-03T21:00:00"), "UTC")).toBeNull();
  });

  it("names a single weekday with the time", () => {
    // Tuesday 21:00 UTC — rrule TU is index 1
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU", utc("2026-03-03T21:00:00"), "UTC"))
      .toBe("Tue 9pm");
  });

  it("renders a non-zero minute with a dot separator", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU", utc("2026-03-03T21:30:00"), "UTC"))
      .toBe("Tue 9.30pm");
  });

  it("renders midnight as 12am, not 0am", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU", utc("2026-03-03T00:00:00"), "UTC"))
      .toBe("Tue 12am");
  });

  it("renders noon as 12pm", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU", utc("2026-03-03T12:00:00"), "UTC"))
      .toBe("Tue 12pm");
  });

  it("labels a late Friday as Erev Shabbos", () => {
    // FR is index 4; hour >= 15 triggers the label
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=FR", utc("2026-03-06T16:00:00"), "UTC"))
      .toBe("Erev Shabbos 4pm");
  });

  it("does not label an early Friday as Erev Shabbos", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=FR", utc("2026-03-06T09:00:00"), "UTC"))
      .toBe("Fri 9am");
  });

  it("labels a late Saturday as Motzei Shabbas", () => {
    // SA is index 5; hour >= 20 triggers the label
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=SA", utc("2026-03-07T21:00:00"), "UTC"))
      .toBe("Motzei Shabbas 9pm");
  });

  it("collapses Mon–Fri to 'Weekdays'", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", utc("2026-03-02T07:00:00"), "UTC"))
      .toBe("Weekdays 7am");
  });

  it("collapses all seven days to 'Daily'", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU", utc("2026-03-02T07:00:00"), "UTC"))
      .toBe("Daily 7am");
  });

  it("collapses Sun–Thu, sorting Sunday to the front", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH", utc("2026-03-02T20:00:00"), "UTC"))
      .toBe("Sun – Thu 8pm");
  });

  it("lists non-contiguous days in Sunday-first order", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=MO,WE,SU", utc("2026-03-02T20:00:00"), "UTC"))
      .toBe("Su, Mo, We 8pm");
  });

  it("reads the hour in the supplied timezone, not UTC", () => {
    // 02:00 UTC on Wed is 21:00 Tue in New York
    const dt = utc("2026-03-04T02:00:00");
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU", dt, "America/New_York")).toBe("Tue 9pm");
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU", dt, "UTC")).toBe("Tue 2am");
  });

  it("falls back to UTC when no timezone is given", () => {
    expect(describeSchedule("FREQ=WEEKLY;BYDAY=TU", utc("2026-03-03T21:00:00"), null))
      .toBe("Tue 9pm");
  });
});

describe("formatInTimezone", () => {
  it("formats in the requested zone", () => {
    const d = utc("2026-03-04T02:00:00");
    expect(formatInTimezone(d, "UTC", "yyyy-MM-dd HH:mm")).toBe("2026-03-04 02:00");
    expect(formatInTimezone(d, "America/New_York", "yyyy-MM-dd HH:mm")).toBe("2026-03-03 21:00");
  });

  it("applies the documented default format", () => {
    expect(formatInTimezone(utc("2026-03-03T21:00:00"), "UTC"))
      .toBe("Tue, Mar 3 at 9:00 PM");
  });
});
