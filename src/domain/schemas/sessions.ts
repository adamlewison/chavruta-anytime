import { z } from "zod";
import { isoDateTime, optionalText, text, timezone, uuid } from "./common";

/** createSession(data) */
export const createSessionSchema = z
  .object({
    type: z.enum(["chavruta", "chabura"]),
    chavrutaPairId: uuid.optional(),
    chaburaId: uuid.optional(),
    subjectId: uuid,
    title: text(200),
    rrule: text(500),
    dtstart: isoDateTime,
    durationMin: z.number().int().min(15).max(240),
    timezone,
  })
  .refine(
    (d) => (d.type === "chavruta" ? !!d.chavrutaPairId : !!d.chaburaId),
    "A chavruta session needs chavrutaPairId; a chabura session needs chaburaId",
  );

/** pause / cancel / resume (sessionId) */
export const sessionIdSchema = uuid;

/** cancelOccurrence / restoreOccurrence (occurrenceId) */
export const occurrenceIdSchema = uuid;

/** updateOccurrenceStatus(occurrenceId, status) */
export const updateOccurrenceStatusSchema = z.object({
  occurrenceId: uuid,
  status: z.enum(["scheduled", "cancelled", "completed", "missed"]),
});

/** rescheduleOccurrence(occurrenceId, newStartsAt, newEndsAt) */
export const rescheduleOccurrenceSchema = z
  .object({
    occurrenceId: uuid,
    newStartsAt: isoDateTime,
    newEndsAt: isoDateTime,
  })
  .refine((d) => new Date(d.newEndsAt) > new Date(d.newStartsAt), "End must be after start");

/** updateSessionSchedule(data) */
export const updateSessionScheduleSchema = z.object({
  sessionId: uuid,
  rrule: text(500),
  dtstart: isoDateTime,
  timezone,
  durationMin: z.number().int().min(15).max(240),
});

/** saveOccurrenceNotes(occurrenceId, notes) */
export const saveOccurrenceNotesSchema = z.object({
  occurrenceId: uuid,
  notes: optionalText(5000),
});
