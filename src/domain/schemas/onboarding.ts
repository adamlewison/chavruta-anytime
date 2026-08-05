import { z } from "zod";
import { countryCode, optionalText, text, timezone, uuid } from "./common";

/**
 * completeOnboarding(data)
 *
 * Mirrors what the onboarding wizard actually submits. Two fields are looser
 * than they first appear they should be, because the wizard legitimately
 * produces them and a schema that rejects working input is worse than none:
 *
 *  - `availability` arrives as `[]` when the user skips step 6 (that step has
 *    no validation gate), and the action calls Buffer.from() on it, which
 *    accepts an empty array. So 0 or 42 bytes are both valid; any other length
 *    is a malformed bitmap and is rejected.
 *  - `image` is a stored blob URL or an OAuth avatar URL, length-bounded only.
 *    Asserting URL syntax risks breaking uploads for no real safety gain — the
 *    value is stored and rendered as an image src, never executed.
 */
export const completeOnboardingSchema = z.object({
  name: text(100),
  bio: optionalText(280),
  image: z.string().max(2048).nullable(),
  gender: z.enum(["male", "female"]),
  country: countryCode,
  postCode: optionalText(20),
  languages: z.array(z.string().min(1).max(20)).min(1, "Select at least one language"),
  timezone,
  // Subject IDs only — proficiency levels are set later, not during onboarding.
  subjects: z.array(uuid).min(1, "Select at least one subject"),
  availability: z
    .array(z.number().int().min(0).max(255))
    .refine(
      (a) => a.length === 0 || a.length === 42,
      "Availability must be empty or exactly 42 bytes",
    ),
});
