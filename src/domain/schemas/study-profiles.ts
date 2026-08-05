import { z } from "zod";
import { optionalText, uuid } from "./common";

/**
 * Study-profile availability travels as a bit-per-character string, not base64:
 * 336 characters of "0"/"1", one per half-hour slot in the week. Shorter strings
 * are tolerated because stringToBitmap() reads up to min(len, 336) and
 * zero-fills the rest, which is existing behaviour.
 */
const availabilityBlob = z
  .string()
  .regex(/^[01]*$/, "Availability must be a string of 0s and 1s")
  .max(336, "Availability cannot exceed 336 slots");

/** createStudyProfile(data) */
export const createStudyProfileSchema = z.object({
  subjectId: uuid,
  availabilityLocal: availabilityBlob,
  availabilityUtc: availabilityBlob,
  notes: optionalText(1000).optional(),
});

/** updateStudyProfile(data) */
export const updateStudyProfileSchema = z.object({
  id: uuid,
  subjectId: uuid,
  availabilityLocal: availabilityBlob,
  availabilityUtc: availabilityBlob,
  notes: optionalText(1000).optional(),
  active: z.boolean(),
});
