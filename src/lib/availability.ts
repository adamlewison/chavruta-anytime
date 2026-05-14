import { DateTime } from "luxon";

// ── Constants ──────────────────────────────────────────────────────────
const TOTAL_BITS = 336; // 7 days × 48 half-hour slots
const TOTAL_BYTES = 42; // 336 / 8
const SLOTS_PER_DAY = 48;

// Byte-level popcount lookup table (0–255 → number of set bits)
const POPCOUNT_TABLE = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  POPCOUNT_TABLE[i] = POPCOUNT_TABLE[i >> 1]! + (i & 1);
}

// ── Bit helpers ────────────────────────────────────────────────────────

/**
 * Get the value of bit at `index` in the 336-bit bitmap.
 * Bit index = dayOfWeek * 48 + halfHourSlot (Sunday=0, slot 0 = 00:00–00:30).
 */
export function getBit(bitmap: Uint8Array, index: number): boolean {
  const byteIdx = index >> 3;
  const bitIdx = index & 7;
  return (bitmap[byteIdx]! & (1 << bitIdx)) !== 0;
}

/** Set bit at `index` to 1. */
export function setBit(bitmap: Uint8Array, index: number): void {
  const byteIdx = index >> 3;
  const bitIdx = index & 7;
  bitmap[byteIdx] = bitmap[byteIdx]! | (1 << bitIdx);
}

/** Clear bit at `index` to 0. */
export function clearBit(bitmap: Uint8Array, index: number): void {
  const byteIdx = index >> 3;
  const bitIdx = index & 7;
  bitmap[byteIdx] = bitmap[byteIdx]! & ~(1 << bitIdx);
}

/** Toggle bit at `index`. */
export function toggleBit(bitmap: Uint8Array, index: number): void {
  const byteIdx = index >> 3;
  const bitIdx = index & 7;
  bitmap[byteIdx] = bitmap[byteIdx]! ^ (1 << bitIdx);
}

// ── Factory ────────────────────────────────────────────────────────────

/** Create a zeroed 42-byte (336-bit) bitmap. */
export function createEmptyBitmap(): Uint8Array {
  return new Uint8Array(TOTAL_BYTES);
}

// ── Bitwise operations ────────────────────────────────────────────────

/** Byte-level AND of two 42-byte bitmaps. Returns a new Uint8Array(42). */
export function bitwiseAnd(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(TOTAL_BYTES);
  for (let i = 0; i < TOTAL_BYTES; i++) {
    result[i] = a[i]! & b[i]!;
  }
  return result;
}

/** Byte-level OR of two 42-byte bitmaps. Returns a new Uint8Array(42). */
export function bitwiseOr(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(TOTAL_BYTES);
  for (let i = 0; i < TOTAL_BYTES; i++) {
    result[i] = a[i]! | b[i]!;
  }
  return result;
}

/** Byte-level NOT of a 42-byte bitmap. Returns a new Uint8Array(42). */
export function bitwiseNot(a: Uint8Array): Uint8Array {
  const result = new Uint8Array(TOTAL_BYTES);
  for (let i = 0; i < TOTAL_BYTES; i++) {
    result[i] = ~a[i]! & 0xff;
  }
  return result;
}

// ── Popcount ───────────────────────────────────────────────────────────

/** Count the number of set bits in a 42-byte bitmap. */
export function popcount(mask: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < TOTAL_BYTES; i++) {
    count += POPCOUNT_TABLE[mask[i]!]!;
  }
  return count;
}

/** Count set bits and convert to hours (each bit = 30 min). */
export function popcountHours(mask: Uint8Array): number {
  return popcount(mask) / 2;
}

// ── Circular rotation ─────────────────────────────────────────────────

/**
 * Rotate the 336-bit bitmap left by `n` positions (circularly).
 * Each bit at position i moves to position (i + n) % 336.
 * Bit 335 wraps to bit 0.
 */
export function rotateLeft(mask: Uint8Array, n: number): Uint8Array {
  n = ((n % TOTAL_BITS) + TOTAL_BITS) % TOTAL_BITS;
  if (n === 0) return new Uint8Array(mask);

  const result = createEmptyBitmap();
  for (let i = 0; i < TOTAL_BITS; i++) {
    if (getBit(mask, i)) {
      const dest = (i + n) % TOTAL_BITS;
      setBit(result, dest);
    }
  }
  return result;
}

/**
 * Rotate the 336-bit bitmap right by `n` positions (circularly).
 * Each bit at position i moves to position (i - n + 336) % 336.
 * Bit 0 wraps to bit 335.
 */
export function rotateRight(mask: Uint8Array, n: number): Uint8Array {
  n = ((n % TOTAL_BITS) + TOTAL_BITS) % TOTAL_BITS;
  return rotateLeft(mask, TOTAL_BITS - n);
}

// ── Dilation ───────────────────────────────────────────────────────────

/**
 * Produce a "fuzzy" version of the bitmap by setting each bit and
 * its ±1 neighbors on the 336-bit ring.
 *
 * dilate(M) = M | rotateLeft(M, 1) | rotateRight(M, 1)
 */
export function dilate(mask: Uint8Array): Uint8Array {
  const left = rotateLeft(mask, 1);
  const right = rotateRight(mask, 1);
  return bitwiseOr(bitwiseOr(mask, left), right);
}

// ── Overlap ────────────────────────────────────────────────────────────

/**
 * Compute strict and near overlap between two UTC-aligned bitmaps.
 *
 * strict     = A & B
 * near_raw   = (dilate(A) & B) | (A & dilate(B))
 * near_only  = near_raw & ~strict
 *
 * exactHours = popcount(strict) / 2
 * nearHours  = popcount(near_only) / 2
 */
export function overlap(
  a: Uint8Array,
  b: Uint8Array,
): {
  exactHours: number;
  nearHours: number;
  strictMask: Uint8Array;
  nearMask: Uint8Array;
} {
  const strictMask = bitwiseAnd(a, b);

  const nearRaw = bitwiseOr(
    bitwiseAnd(dilate(a), b),
    bitwiseAnd(a, dilate(b)),
  );
  const nearMask = bitwiseAnd(nearRaw, bitwiseNot(strictMask));

  return {
    exactHours: popcountHours(strictMask),
    nearHours: popcountHours(nearMask),
    strictMask,
    nearMask,
  };
}

// ── UTC expansion ──────────────────────────────────────────────────────

/**
 * Convert a user's local-timezone bitmap to a UTC-aligned 336-bit mask
 * for a specific reference week.
 *
 * For each bit i in 0..335:
 *   localStart = sundayLocal(tz) + i * 30 minutes
 *   utcStart   = localStart.toUTC()
 *   utcBit     = floor((utcStart - weekRefUtc).asMinutes / 30)
 *   expandedMask[utcBit] = bitmap[i]
 *
 * weekStartUtc should be a Sunday 00:00 UTC. The 336-bit ring wraps.
 */
export function expandToUtcWeek(
  bitmap: Uint8Array,
  tz: string,
  weekStartUtc: DateTime,
): Uint8Array {
  const result = createEmptyBitmap();

  // Find Sunday 00:00 in the user's local timezone for this week.
  // Start from the weekStartUtc date and find the Sunday in local tz.
  const localAtUtcStart = weekStartUtc.setZone(tz);

  // Luxon weekday: 1=Mon ... 7=Sun
  let localSunday: DateTime;
  if (localAtUtcStart.weekday === 7) {
    localSunday = localAtUtcStart.startOf("day");
  } else {
    localSunday = localAtUtcStart
      .minus({ days: localAtUtcStart.weekday })
      .startOf("day");
  }

  for (let i = 0; i < TOTAL_BITS; i++) {
    if (!getBit(bitmap, i)) continue;

    const localStart = localSunday.plus({ minutes: i * 30 });
    const utcStart = localStart.toUTC();

    const diffMinutes = utcStart.diff(weekStartUtc, "minutes").minutes;
    const utcBit = Math.floor(diffMinutes / 30);

    // Wrap around the 336-bit ring
    const wrappedBit = ((utcBit % TOTAL_BITS) + TOTAL_BITS) % TOTAL_BITS;
    setBit(result, wrappedBit);
  }

  return result;
}

// ── Date helpers ───────────────────────────────────────────────────────

/** Return the next Sunday 00:00 UTC (or today if it's already Sunday). */
export function getNextSundayUtc(): DateTime {
  const now = DateTime.utc();
  // Luxon weekday: 1=Mon ... 7=Sun
  const daysUntilSunday = now.weekday === 7 ? 0 : 7 - now.weekday;
  return now.plus({ days: daysUntilSunday }).startOf("day");
}

// ── Presets ─────────────────────────────────────────────────────────────

export type AvailabilityPreset =
  | "weekday-evenings" // Mon-Fri 7pm-10pm
  | "weekday-mornings" // Mon-Fri 6am-9am
  | "late-night" // Every day 10pm-1am
  | "clear-all";

/**
 * Generate a bitmap for the given preset.
 * All times are in the user's local timezone (the bitmap is local-anchored).
 * Days: Sunday=0, Monday=1, ..., Saturday=6
 * Slots: 0 = 00:00–00:30, 1 = 00:30–01:00, ..., 47 = 23:30–00:00
 */
export function applyPreset(
  preset: AvailabilityPreset,
  _tz: string,
): Uint8Array {
  const bitmap = createEmptyBitmap();

  if (preset === "clear-all") {
    return bitmap;
  }

  if (preset === "weekday-evenings") {
    // Mon(1)–Fri(5), 7pm(slot 38)–10pm(slot 44) → slots 38..43
    for (let day = 1; day <= 5; day++) {
      for (let slot = 38; slot < 44; slot++) {
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
      }
    }
    return bitmap;
  }

  if (preset === "weekday-mornings") {
    // Mon(1)–Fri(5), 6am(slot 12)–9am(slot 18) → slots 12..17
    for (let day = 1; day <= 5; day++) {
      for (let slot = 12; slot < 18; slot++) {
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
      }
    }
    return bitmap;
  }

  if (preset === "late-night") {
    // Every day 10pm(slot 44)–1am(slot 2 next day)
    // Slots 44..47 of current day + slots 0..1 of next day
    for (let day = 0; day < 7; day++) {
      // 10pm–midnight: slots 44–47
      for (let slot = 44; slot < SLOTS_PER_DAY; slot++) {
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
      }
      // midnight–1am of next day: slots 0–1
      const nextDay = (day + 1) % 7;
      for (let slot = 0; slot < 2; slot++) {
        setBit(bitmap, nextDay * SLOTS_PER_DAY + slot);
      }
    }
    return bitmap;
  }

  return bitmap;
}

export { SLOTS_PER_DAY, TOTAL_BITS, TOTAL_BYTES };
