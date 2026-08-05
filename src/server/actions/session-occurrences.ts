"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import {
  learningSessions,
  sessionOccurrences,
  sessionOccurrenceParticipants,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  occurrenceIdSchema,
  updateOccurrenceStatusSchema,
  rescheduleOccurrenceSchema,
  saveOccurrenceNotesSchema,
} from "@/domain/schemas/sessions";
import { firstError } from "@/domain/schemas/common";

export async function cancelOccurrence(
  occurrenceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = occurrenceIdSchema.safeParse(occurrenceId);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [occ] = await db()
      .select({ sessionId: sessionOccurrences.sessionId })
      .from(sessionOccurrences)
      .where(eq(sessionOccurrences.id, occurrenceId));

    if (!occ) return { success: false, error: "Occurrence not found" };

    const [ls] = await db()
      .select({ createdById: learningSessions.createdById })
      .from(learningSessions)
      .where(eq(learningSessions.id, occ.sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await db()
      .update(sessionOccurrences)
      .set({ status: "cancelled" })
      .where(eq(sessionOccurrences.id, occurrenceId));

    await db()
      .update(sessionOccurrenceParticipants)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(sessionOccurrenceParticipants.occurrenceId, occurrenceId));

    return { success: true };
  } catch (error) {
    console.error("cancelOccurrence error:", error);
    return { success: false, error: "Failed to cancel occurrence" };
  }
}

export async function restoreOccurrence(
  occurrenceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = occurrenceIdSchema.safeParse(occurrenceId);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [occ] = await db()
      .select({ sessionId: sessionOccurrences.sessionId })
      .from(sessionOccurrences)
      .where(eq(sessionOccurrences.id, occurrenceId));

    if (!occ) return { success: false, error: "Occurrence not found" };

    const [ls] = await db()
      .select({ createdById: learningSessions.createdById })
      .from(learningSessions)
      .where(eq(learningSessions.id, occ.sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await db()
      .update(sessionOccurrences)
      .set({ status: "scheduled" })
      .where(eq(sessionOccurrences.id, occurrenceId));

    await db()
      .update(sessionOccurrenceParticipants)
      .set({ status: "invited", updatedAt: new Date() })
      .where(eq(sessionOccurrenceParticipants.occurrenceId, occurrenceId));

    return { success: true };
  } catch (error) {
    console.error("restoreOccurrence error:", error);
    return { success: false, error: "Failed to restore occurrence" };
  }
}

/**
 * Inserts a single scheduled occurrence for a session (no-op if one already
 * exists at that start time, via onConflictDoNothing). Used by the
 * occurrence-topup cron to keep each active session stocked with future
 * occurrences.
 */
export async function createOccurrence(sessionId: string, startsAt: Date, endsAt: Date) {
  await db()
    .insert(sessionOccurrences)
    .values({
      sessionId,
      startsAt,
      endsAt,
      status: "scheduled",
    })
    .onConflictDoNothing();
}

export async function updateOccurrenceStatus(
  occurrenceId: string,
  status: "scheduled" | "cancelled" | "completed" | "missed",
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = updateOccurrenceStatusSchema.safeParse({ occurrenceId, status });
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [occ] = await db()
      .select({ sessionId: sessionOccurrences.sessionId })
      .from(sessionOccurrences)
      .where(eq(sessionOccurrences.id, occurrenceId));

    if (!occ) return { success: false, error: "Occurrence not found" };

    const [ls] = await db()
      .select({ createdById: learningSessions.createdById })
      .from(learningSessions)
      .where(eq(learningSessions.id, occ.sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await db()
      .update(sessionOccurrences)
      .set({ status })
      .where(eq(sessionOccurrences.id, occurrenceId));

    return { success: true };
  } catch (error) {
    console.error("updateOccurrenceStatus error:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function rescheduleOccurrence(
  occurrenceId: string,
  newStartsAt: string,
  newEndsAt: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = rescheduleOccurrenceSchema.safeParse({ occurrenceId, newStartsAt, newEndsAt });
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [occ] = await db()
      .select({
        sessionId: sessionOccurrences.sessionId,
        status: sessionOccurrences.status,
      })
      .from(sessionOccurrences)
      .where(eq(sessionOccurrences.id, occurrenceId));

    if (!occ) return { success: false, error: "Occurrence not found" };
    if (occ.status !== "scheduled") {
      return {
        success: false,
        error: "Only scheduled occurrences can be rescheduled",
      };
    }

    const [ls] = await db()
      .select({ createdById: learningSessions.createdById })
      .from(learningSessions)
      .where(eq(learningSessions.id, occ.sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    const startsAt = new Date(newStartsAt);
    const endsAt = new Date(newEndsAt);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return { success: false, error: "Invalid date/time" };
    }
    if (endsAt <= startsAt) {
      return { success: false, error: "End time must be after start time" };
    }

    await db()
      .update(sessionOccurrences)
      .set({ startsAt, endsAt })
      .where(eq(sessionOccurrences.id, occurrenceId));

    return { success: true };
  } catch (error) {
    console.error("rescheduleOccurrence error:", error);
    return { success: false, error: "Failed to reschedule occurrence" };
  }
}

export async function saveOccurrenceNotes(
  occurrenceId: string,
  notes: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = saveOccurrenceNotesSchema.safeParse({ occurrenceId, notes });
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [occ] = await db()
      .select({
        sessionId: sessionOccurrences.sessionId,
        startsAt: sessionOccurrences.startsAt,
      })
      .from(sessionOccurrences)
      .where(eq(sessionOccurrences.id, occurrenceId));

    if (!occ) return { success: false, error: "Occurrence not found" };

    // Notes editable for 7 days after the session starts
    const sevenDaysAfter = new Date(
      occ.startsAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    if (new Date() > sevenDaysAfter) {
      return {
        success: false,
        error: "Notes can only be edited within 7 days of the session",
      };
    }

    const [ls] = await db()
      .select({ createdById: learningSessions.createdById })
      .from(learningSessions)
      .where(eq(learningSessions.id, occ.sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await db()
      .update(sessionOccurrences)
      .set({ notes: notes.trim() || null })
      .where(eq(sessionOccurrences.id, occurrenceId));

    return { success: true };
  } catch (error) {
    console.error("saveOccurrenceNotes error:", error);
    return { success: false, error: "Failed to save notes" };
  }
}
