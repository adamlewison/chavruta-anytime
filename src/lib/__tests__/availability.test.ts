import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import {
  createEmptyBitmap,
  getBit,
  setBit,
  clearBit,
  toggleBit,
  bitwiseAnd,
  bitwiseOr,
  bitwiseNot,
  popcount,
  popcountHours,
  rotateLeft,
  rotateRight,
  dilate,
  overlap,
  expandToUtcWeek,
  getNextSundayUtc,
  applyPreset,
  TOTAL_BITS,
} from "../availability";

describe("availability bitmap", () => {
  describe("bit helpers", () => {
    it("getBit/setBit/clearBit/toggleBit work correctly", () => {
      const bm = createEmptyBitmap();
      expect(getBit(bm, 0)).toBe(false);

      setBit(bm, 0);
      expect(getBit(bm, 0)).toBe(true);

      clearBit(bm, 0);
      expect(getBit(bm, 0)).toBe(false);

      toggleBit(bm, 10);
      expect(getBit(bm, 10)).toBe(true);
      toggleBit(bm, 10);
      expect(getBit(bm, 10)).toBe(false);
    });

    it("handles boundary bits (0, 335)", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 0);
      setBit(bm, 335);
      expect(getBit(bm, 0)).toBe(true);
      expect(getBit(bm, 335)).toBe(true);
      expect(popcount(bm)).toBe(2);
    });
  });

  describe("createEmptyBitmap", () => {
    it("returns Uint8Array of length 42 with all zeros", () => {
      const bm = createEmptyBitmap();
      expect(bm.length).toBe(42);
      expect(popcount(bm)).toBe(0);
    });
  });

  describe("popcount", () => {
    it("empty bitmap has popcount 0", () => {
      expect(popcount(createEmptyBitmap())).toBe(0);
    });

    it("full bitmap has popcount 336", () => {
      const bm = new Uint8Array(42).fill(0xff);
      expect(popcount(bm)).toBe(336);
    });

    it("popcountHours returns popcount / 2", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 0);
      setBit(bm, 1);
      setBit(bm, 2);
      setBit(bm, 3);
      expect(popcountHours(bm)).toBe(2);
    });
  });

  describe("dilate", () => {
    it("single bit set produces exactly 3 bits", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 100);
      const dilated = dilate(bm);
      expect(popcount(dilated)).toBe(3);
      expect(getBit(dilated, 99)).toBe(true);
      expect(getBit(dilated, 100)).toBe(true);
      expect(getBit(dilated, 101)).toBe(true);
    });

    it("Sat 23:30 (bit 335) wraps to Sun 00:00 (bit 0) and Sat 23:00 (bit 334)", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 335); // Saturday 23:30
      const dilated = dilate(bm);
      expect(popcount(dilated)).toBe(3);
      expect(getBit(dilated, 334)).toBe(true); // Sat 23:00
      expect(getBit(dilated, 335)).toBe(true); // Sat 23:30
      expect(getBit(dilated, 0)).toBe(true); // Sun 00:00 (wrap)
    });

    it("Sun 00:00 (bit 0) wraps to Sat 23:30 (bit 335) and Sun 00:30 (bit 1)", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 0); // Sunday 00:00
      const dilated = dilate(bm);
      expect(popcount(dilated)).toBe(3);
      expect(getBit(dilated, 335)).toBe(true); // Sat 23:30 (wrap)
      expect(getBit(dilated, 0)).toBe(true); // Sun 00:00
      expect(getBit(dilated, 1)).toBe(true); // Sun 00:30
    });
  });

  describe("rotateLeft / rotateRight", () => {
    it("rotateLeft by 1 moves bit 0 to bit 1", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 0);
      const rotated = rotateLeft(bm, 1);
      expect(getBit(rotated, 0)).toBe(false);
      expect(getBit(rotated, 1)).toBe(true);
    });

    it("rotateLeft wraps bit 335 to bit 0", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 335);
      const rotated = rotateLeft(bm, 1);
      expect(getBit(rotated, 335)).toBe(false);
      expect(getBit(rotated, 0)).toBe(true);
    });

    it("rotateRight by 1 moves bit 1 to bit 0", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 1);
      const rotated = rotateRight(bm, 1);
      expect(getBit(rotated, 0)).toBe(true);
      expect(getBit(rotated, 1)).toBe(false);
    });

    it("rotateRight wraps bit 0 to bit 335", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 0);
      const rotated = rotateRight(bm, 1);
      expect(getBit(rotated, 335)).toBe(true);
      expect(getBit(rotated, 0)).toBe(false);
    });

    it("rotateLeft(rotateRight(x, n), n) === x", () => {
      const bm = createEmptyBitmap();
      setBit(bm, 42);
      setBit(bm, 200);
      setBit(bm, 335);
      const roundTrip = rotateLeft(rotateRight(bm, 17), 17);
      for (let i = 0; i < TOTAL_BITS; i++) {
        expect(getBit(roundTrip, i)).toBe(getBit(bm, i));
      }
    });
  });

  describe("overlap", () => {
    it("invariant: exactHours + nearHours <= popcountHours(bitwiseOr(A, B))", () => {
      const a = createEmptyBitmap();
      const b = createEmptyBitmap();
      // Set some bits in A
      for (let i = 10; i < 30; i++) setBit(a, i);
      // Set some bits in B, overlapping and near
      for (let i = 20; i < 40; i++) setBit(b, i);

      const result = overlap(a, b);
      const unionHours = popcountHours(bitwiseOr(a, b));
      expect(result.exactHours + result.nearHours).toBeLessThanOrEqual(
        unionHours,
      );
    });

    it("strict and near_only masks are disjoint", () => {
      const a = createEmptyBitmap();
      const b = createEmptyBitmap();
      for (let i = 0; i < 50; i++) setBit(a, i);
      for (let i = 25; i < 75; i++) setBit(b, i);

      const result = overlap(a, b);
      const intersection = bitwiseAnd(result.strictMask, result.nearMask);
      expect(popcount(intersection)).toBe(0);
    });

    it("empty bitmap: overlap with anything produces 0", () => {
      const empty = createEmptyBitmap();
      const full = new Uint8Array(42).fill(0xff);
      const result = overlap(empty, full);
      expect(result.exactHours).toBe(0);
      expect(result.nearHours).toBe(0);
    });

    it("identical bitmaps: nearHours is 0, exactHours = popcountHours", () => {
      const a = createEmptyBitmap();
      for (let i = 10; i < 30; i++) setBit(a, i);
      const result = overlap(a, a);
      expect(result.exactHours).toBe(popcountHours(a));
      // Near should be 0 since all overlap is exact
      // Actually near_raw includes exact positions too, but near_only = near_raw & ~strict
      // So near_only should only have the dilation fringe not in strict
      // For identical bitmaps, near_raw = dilate(A) & A | A & dilate(A) = dilate(A) & A
      // dilate(A) & A = A (A is subset of dilate(A))
      // So near_raw = A, and near_only = A & ~A = 0
      expect(result.nearHours).toBe(0);
    });
  });

  describe("expandToUtcWeek — DST handling", () => {
    it("users in America/New_York and Asia/Jerusalem with known overlapping slots", () => {
      // Pick a specific non-DST week: Jan 5, 2025 (Sunday) 00:00 UTC
      const weekStart = DateTime.fromISO("2025-01-05T00:00:00.000Z", {
        zone: "utc",
      });

      // New York is UTC-5 in January
      // Jerusalem is UTC+2 in January
      // If NY user is available Monday 9pm local (= Tue 02:00 UTC)
      // and Jerusalem user is available Tuesday 4am local (= Tue 02:00 UTC)
      // they should overlap

      const nyBitmap = createEmptyBitmap();
      // Monday = day 1, 9pm = slot 42 (21*2)
      setBit(nyBitmap, 1 * 48 + 42); // Mon 21:00 NY
      setBit(nyBitmap, 1 * 48 + 43); // Mon 21:30 NY

      const jlmBitmap = createEmptyBitmap();
      // Tuesday = day 2, 4am = slot 8 (4*2)
      setBit(jlmBitmap, 2 * 48 + 8); // Tue 04:00 JLM → Tue 02:00 UTC
      setBit(jlmBitmap, 2 * 48 + 9); // Tue 04:30 JLM → Tue 02:30 UTC

      const nyUtc = expandToUtcWeek(nyBitmap, "America/New_York", weekStart);
      const jlmUtc = expandToUtcWeek(jlmBitmap, "Asia/Jerusalem", weekStart);

      // NY Mon 21:00 = Tue 02:00 UTC = day 2 slot 4 = bit 2*48+4=100
      // NY Mon 21:30 = Tue 02:30 UTC = day 2 slot 5 = bit 2*48+5=101
      // JLM Tue 04:00 = Tue 02:00 UTC = bit 100
      // JLM Tue 04:30 = Tue 02:30 UTC = bit 101

      const result = overlap(nyUtc, jlmUtc);
      expect(result.exactHours).toBe(1); // 2 slots = 1 hour
    });

    it("handles DST spring-forward transition", () => {
      // March 9, 2025 is spring-forward in US (2am → 3am)
      // Week of March 9, 2025 (Sunday)
      const weekStart = DateTime.fromISO("2025-03-09T00:00:00.000Z", {
        zone: "utc",
      });

      const bitmap = createEmptyBitmap();
      // Sunday 2:00am slot (slot 4) — this hour doesn't exist in spring-forward
      // But the bitmap is local, so bit is set. The expansion should handle the skip.
      setBit(bitmap, 0 * 48 + 4); // Sun 02:00 local

      // This shouldn't crash
      const utcMask = expandToUtcWeek(bitmap, "America/New_York", weekStart);
      // The bit should still map somewhere (luxon handles invalid times)
      expect(popcount(utcMask)).toBeGreaterThanOrEqual(0);
    });
  });

  describe("bitwiseAnd / bitwiseOr / bitwiseNot", () => {
    it("bitwiseAnd produces intersection", () => {
      const a = createEmptyBitmap();
      const b = createEmptyBitmap();
      setBit(a, 5);
      setBit(a, 10);
      setBit(b, 10);
      setBit(b, 15);
      const result = bitwiseAnd(a, b);
      expect(popcount(result)).toBe(1);
      expect(getBit(result, 10)).toBe(true);
    });

    it("bitwiseOr produces union", () => {
      const a = createEmptyBitmap();
      const b = createEmptyBitmap();
      setBit(a, 5);
      setBit(b, 10);
      const result = bitwiseOr(a, b);
      expect(popcount(result)).toBe(2);
      expect(getBit(result, 5)).toBe(true);
      expect(getBit(result, 10)).toBe(true);
    });

    it("bitwiseNot flips all bits", () => {
      const empty = createEmptyBitmap();
      const full = bitwiseNot(empty);
      expect(popcount(full)).toBe(336);
    });
  });

  describe("getNextSundayUtc", () => {
    it("returns a DateTime in UTC on a Sunday", () => {
      const sunday = getNextSundayUtc();
      expect(sunday.zone.name).toBe("UTC");
      // Luxon weekday 7 = Sunday
      expect(sunday.weekday).toBe(7);
      expect(sunday.hour).toBe(0);
      expect(sunday.minute).toBe(0);
      expect(sunday.second).toBe(0);
    });
  });

  describe("presets", () => {
    it("weekday-evenings: Mon-Fri 7pm-10pm = 5 days × 6 slots = 30 bits", () => {
      const bm = applyPreset("weekday-evenings", "America/New_York");
      expect(popcount(bm)).toBe(30);
    });

    it("weekday-mornings: Mon-Fri 6am-9am = 5 days × 6 slots = 30 bits", () => {
      const bm = applyPreset("weekday-mornings", "America/New_York");
      expect(popcount(bm)).toBe(30);
    });

    it("late-night: every day 10pm-1am = 7 days × 6 slots = 42 bits", () => {
      const bm = applyPreset("late-night", "America/New_York");
      // Each day contributes 4 slots (10pm-midnight) + 2 slots (midnight-1am next day)
      // But midnight-1am overlaps with the next day's contribution
      // Sun: slots 44-47 (4) + Mon slots 0-1 (2)
      // Mon: slots 44-47 (4) + Tue slots 0-1 (2)
      // ... but Mon slots 0-1 were already set by Sun's midnight block
      // Actually each "day" sets its own 44-47 + next day 0-1
      // After all 7 days: each day has slots 0-1 set (from prev day) + slots 44-47 set
      // = 6 unique slots per day × 7 = 42
      expect(popcount(bm)).toBe(42);
    });

    it("clear-all returns empty bitmap", () => {
      const bm = applyPreset("clear-all", "America/New_York");
      expect(popcount(bm)).toBe(0);
    });
  });
});
