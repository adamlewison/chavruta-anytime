"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import {
  learningSessions,
  sessionOccurrences,
  sessionParticipants,
  sessionOccurrenceParticipants,
  notifications,
} from "@/db/schema";
import { eq, and, gt, inArray } from "drizzle-orm";
import { RRule } from "rrule";
import { sessionIdSchema, updateSessionScheduleSchema } from "@/domain/schemas/sessions";
import { firstError } from "@/domain/schemas/common";

export async function pauseSession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = sessionIdSchema.safeParse(sessionId);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [ls] = await db()
      .select({ createdById: learningSessions.createdById })
      .from(learningSessions)
      .where(eq(learningSessions.id, sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await db()
      .update(learningSessions)
      .set({ status: "paused", updatedAt: new Date() })
      .where(eq(learningSessions.id, sessionId));

    return { success: true };
  } catch (error) {
    console.error("pauseSession error:", error);
    return { success: false, error: "Failed to pause session" };
  }
}

export async function cancelSession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = sessionIdSchema.safeParse(sessionId);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const userId = session.user.id;

    // Fetch session for auth check + notification payload
    const [ls] = await db()
      .select({
        title: learningSessions.title,
        type: learningSessions.type,
        chavrutaPairId: learningSessions.chavrutaPairId,
        chaburaId: learningSessions.chaburaId,
        createdById: learningSessions.createdById,
      })
      .from(learningSessions)
      .where(eq(learningSessions.id, sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== userId) {
      return { success: false, error: "Not authorized" };
    }

    // Cancel session and future occurrences
    await db()
      .update(learningSessions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(learningSessions.id, sessionId));

    const now = new Date();

    // Fetch future occurrence IDs before cancelling them
    const futureOccurrences = await db()
      .select({ id: sessionOccurrences.id })
      .from(sessionOccurrences)
      .where(
        and(
          eq(sessionOccurrences.sessionId, sessionId),
          gt(sessionOccurrences.startsAt, now),
        ),
      );
    const futureOccurrenceIds = futureOccurrences.map((o) => o.id);

    await db()
      .update(sessionOccurrences)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(sessionOccurrences.sessionId, sessionId),
          gt(sessionOccurrences.startsAt, now),
        ),
      );

    // Mark occurrence participants as cancelled for all future occurrences
    if (futureOccurrenceIds.length > 0) {
      await db()
        .update(sessionOccurrenceParticipants)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(
          inArray(
            sessionOccurrenceParticipants.occurrenceId,
            futureOccurrenceIds,
          ),
        );
    }

    // Notify session participants (excluding creator)
    const participants = await db()
      .select({ userId: sessionParticipants.userId })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId));

    for (const p of participants) {
      if (p.userId === userId) continue;
      await db()
        .insert(notifications)
        .values({
          userId: p.userId,
          type: "session_cancelled",
          payload: { sessionId, title: ls.title ?? "A session" },
        });
    }

    return { success: true };
  } catch (error) {
    console.error("cancelSession error:", error);
    return { success: false, error: "Failed to cancel session" };
  }
}

export async function resumeSession(
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = sessionIdSchema.safeParse(sessionId);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [ls] = await db()
      .select({ createdById: learningSessions.createdById })
      .from(learningSessions)
      .where(eq(learningSessions.id, sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id) {
      return { success: false, error: "Not authorized" };
    }

    await db()
      .update(learningSessions)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(learningSessions.id, sessionId));

    return { success: true };
  } catch (error) {
    console.error("resumeSession error:", error);
    return { success: false, error: "Failed to resume session" };
  }
}

export async function updateSessionSchedule(data: {
  sessionId: string;
  rrule: string;
  dtstart: string;
  timezone: string;
  durationMin: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return { success: false, error: "Not authenticated" };

    const parsed = updateSessionScheduleSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const [ls] = await db()
      .select({
        createdById: learningSessions.createdById,
        meetUrl: learningSessions.meetUrl,
      })
      .from(learningSessions)
      .where(eq(learningSessions.id, data.sessionId));

    if (!ls) return { success: false, error: "Session not found" };
    if (ls.createdById !== session.user.id)
      return { success: false, error: "Not authorized" };

    const dtstart = new Date(data.dtstart);

    await db()
      .update(learningSessions)
      .set({
        rrule: data.rrule,
        dtstart,
        timezone: data.timezone,
        durationMin: data.durationMin,
        updatedAt: new Date(),
      })
      .where(eq(learningSessions.id, data.sessionId));

    const now = new Date();
    await db()
      .delete(sessionOccurrences)
      .where(
        and(
          eq(sessionOccurrences.sessionId, data.sessionId),
          gt(sessionOccurrences.startsAt, now),
        ),
      );

    const rule = new RRule({
      ...RRule.parseString(data.rrule),
      dtstart,
    });
    const upcoming = rule.all((_, i) => i < 12);

    if (upcoming.length > 0) {
      await db()
        .insert(sessionOccurrences)
        .values(
          upcoming.map((startDate) => ({
            sessionId: data.sessionId,
            startsAt: startDate,
            endsAt: new Date(startDate.getTime() + data.durationMin * 60 * 1000),
            status: "scheduled" as const,
            meetUrl: ls.meetUrl,
          })),
        );
    }

    return { success: true };
  } catch (error) {
    console.error("updateSessionSchedule error:", error);
    return { success: false, error: "Failed to update schedule" };
  }
}
