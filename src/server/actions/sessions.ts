"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import {
  learningSessions,
  sessionOccurrences,
  sessionParticipants,
  sessionOccurrenceParticipants,
  connections,
  notifications,
  subjects,
  chaburaMembers,
  users,
} from "@/db/schema";
import { eq, and, gt, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { RRule } from "rrule";
import { createSessionSchema, sessionIdSchema, occurrenceIdSchema, updateOccurrenceStatusSchema, rescheduleOccurrenceSchema, updateSessionScheduleSchema, saveOccurrenceNotesSchema } from "@/domain/schemas/sessions";
import { firstError } from "@/domain/schemas/common";

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

async function resolveSessionParticipants(
  type: "chavruta" | "chabura",
  chavrutaPairId: string | null | undefined,
  chaburaId: string | null | undefined,
  creatorId: string,
): Promise<{ userId: string; role: string }[]> {
  const participants: { userId: string; role: string }[] = [
    { userId: creatorId, role: "creator" },
  ];

  if (type === "chavruta" && chavrutaPairId) {
    const [conn] = await db()
      .select({
        requesterId: connections.requesterId,
        addresseeId: connections.addresseeId,
      })
      .from(connections)
      .where(eq(connections.id, chavrutaPairId));
    if (conn) {
      const otherId =
        conn.requesterId === creatorId ? conn.addresseeId : conn.requesterId;
      participants.push({ userId: otherId, role: "participant" });
    }
  } else if (type === "chabura" && chaburaId) {
    const members = await db()
      .select({ userId: chaburaMembers.userId, role: chaburaMembers.role })
      .from(chaburaMembers)
      .where(eq(chaburaMembers.chaburaId, chaburaId));
    for (const m of members) {
      if (m.userId !== creatorId && m.role !== "pending") {
        participants.push({ userId: m.userId, role: m.role });
      }
    }
  }

  return participants;
}

async function addSessionParticipants(
  sessionId: string,
  participants: { userId: string; role: string }[],
): Promise<void> {
  if (participants.length === 0) return;
  await db()
    .insert(sessionParticipants)
    .values(
      participants.map((p) => ({ sessionId, userId: p.userId, role: p.role })),
    )
    .onConflictDoNothing();
}

async function addOccurrenceParticipants(
  occurrenceIds: string[],
  userIds: string[],
): Promise<void> {
  if (occurrenceIds.length === 0 || userIds.length === 0) return;
  const rows = occurrenceIds.flatMap((occurrenceId) =>
    userIds.map((userId) => ({
      occurrenceId,
      userId,
      status: "invited" as const,
    })),
  );
  await db()
    .insert(sessionOccurrenceParticipants)
    .values(rows)
    .onConflictDoNothing();
}

export async function createSession(data: {
  type: "chavruta" | "chabura";
  chavrutaPairId?: string;
  chaburaId?: string;
  subjectId: string;
  title: string;
  rrule: string;
  dtstart: string;
  durationMin: number;
  timezone: string;
}): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = createSessionSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const userId = session.user.id;
    const meetUrl = `https://meet.jit.si/ChavrutaAnytime-${nanoid(16)}`;

    // Resolve subject slug → UUID
    const [subjectRow] = await db()
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.slug, data.subjectId));

    if (!subjectRow) {
      return { success: false, error: "Invalid subject" };
    }

    // Insert learning session
    const [learningSession] = await db()
      .insert(learningSessions)
      .values({
        type: data.type,
        chavrutaPairId: data.chavrutaPairId ?? null,
        chaburaId: data.chaburaId ?? null,
        subjectId: subjectRow.id,
        title: data.title,
        rrule: data.rrule,
        dtstart: new Date(data.dtstart),
        durationMin: data.durationMin,
        timezone: data.timezone,
        status: "active",
        createdById: userId,
      })
      .returning();

    // Generate first 12 occurrences using rrule
    const rule = new RRule({
      ...RRule.parseString(data.rrule),
      dtstart: new Date(data.dtstart),
    });
    const occurrences = rule.all((_, i) => i < 12);

    // Resolve all participants (creator + partner/members)
    const participants = await resolveSessionParticipants(
      data.type,
      data.chavrutaPairId,
      data.chaburaId,
      userId,
    );

    // Populate session_participants
    await addSessionParticipants(learningSession.id, participants);

    // Generate and insert first 12 occurrences, then populate occurrence participants
    let insertedOccurrenceIds: string[] = [];
    if (occurrences.length > 0) {
      const inserted = await db()
        .insert(sessionOccurrences)
        .values(
          occurrences.map((startDate) => {
            const endsAt = new Date(
              startDate.getTime() + data.durationMin * 60 * 1000,
            );
            return {
              sessionId: learningSession.id,
              startsAt: startDate,
              endsAt,
              status: "scheduled" as const,
              meetUrl,
            };
          }),
        )
        .returning({ id: sessionOccurrences.id });
      insertedOccurrenceIds = inserted.map((r) => r.id);
    }

    await addOccurrenceParticipants(
      insertedOccurrenceIds,
      participants.map((p) => p.userId),
    );

    // Get creator name for notification payloads
    const [creator] = await db()
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    // Notify all non-creator participants
    for (const p of participants) {
      if (p.userId === userId) continue;
      await db()
        .insert(notifications)
        .values({
          userId: p.userId,
          type: "session_invite",
          payload: {
            sessionId: learningSession.id,
            title: data.title,
            fromUserId: userId,
            name: creator?.name ?? null,
          },
        });
    }

    return { success: true, sessionId: learningSession.id };
  } catch (error) {
    console.error("createSession error:", error);
    return { success: false, error: "Failed to create session" };
  }
}

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
