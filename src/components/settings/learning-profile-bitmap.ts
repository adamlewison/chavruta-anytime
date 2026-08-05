import {
  getBit,
  setBit,
  createEmptyBitmap,
  expandToUtcWeek,
  getNextSundayUtc,
} from "@/domain/availability";

// ── Bitmap <-> string conversion, and quick-start presets, for the ──────
// learning profile availability picker. Pulled out of learning-profiles.tsx
// because these are pure helpers with no component state or JSX.

export function bitmapToString(bitmap: Uint8Array): string {
  let s = "";
  for (let i = 0; i < 336; i++) s += getBit(bitmap, i) ? "1" : "0";
  return s;
}

export function stringToBitmap(s: string): Uint8Array {
  const bitmap = createEmptyBitmap();
  for (let i = 0; i < Math.min(s.length, 336); i++) {
    if (s[i] === "1") setBit(bitmap, i);
  }
  return bitmap;
}

export function computeUtcString(bitmap: Uint8Array, timezone: string): string {
  const utcBitmap = expandToUtcWeek(bitmap, timezone, getNextSundayUtc());
  return bitmapToString(utcBitmap);
}

const SLOTS_PER_DAY = 48;

export type PresetKey = "weekday-evenings" | "weekday-mornings" | "late-night" | "clear";

export const PRESETS: { key: PresetKey; label: string; description: string }[] = [
  { key: "weekday-evenings", label: "Weekday evenings", description: "Mon–Fri, 7–10pm" },
  { key: "weekday-mornings", label: "Weekday mornings", description: "Mon–Fri, 6–9am" },
  { key: "late-night", label: "Late night", description: "Daily, 10–11pm" },
];

export function buildPresetBitmap(key: PresetKey): Uint8Array {
  const bitmap = createEmptyBitmap();
  if (key === "weekday-evenings") {
    for (let day = 1; day <= 5; day++)
      for (let slot = 38; slot <= 43; slot++)
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
  } else if (key === "weekday-mornings") {
    for (let day = 1; day <= 5; day++)
      for (let slot = 12; slot <= 17; slot++)
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
  } else if (key === "late-night") {
    for (let day = 0; day < 7; day++)
      for (let slot = 44; slot <= 46; slot++)
        setBit(bitmap, day * SLOTS_PER_DAY + slot);
  }
  return bitmap;
}
