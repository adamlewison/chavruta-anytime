"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  learningSessions,
  sessionOccurrences,
  connections,
  notifications,
  subjects,
  chaburaMembers,
  users,
} from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { RRule } from "rrule";

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
        meetUrl,
        createdById: userId,
      })
      .returning();

    // Generate first 12 occurrences using rrule
    const rule = new RRule({
      ...RRule.parseString(data.rrule),
      dtstart: new Date(data.dtstart),
    });
    const occurrences = rule.all((_, i) => i < 12);

    if (occurrences.length > 0) {
      await db().insert(sessionOccurrences).values(
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
      );
    }

    // Get creator name for notification payloads
    const [creator] = await db()
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    // Notify other party for chavruta sessions
    if (data.type === "chavruta" && data.chavrutaPairId) {
      const [connection] = await db()
        .select()
        .from(connections)
        .where(eq(connections.id, data.chavrutaPairId));

      if (connection) {
        const otherUserId =
          connection.requesterId === userId
            ? connection.addresseeId
            : connection.requesterId;

        await db().insert(notifications).values({
          userId: otherUserId,
          type: "session_invite",
          payload: {
            sessionId: learningSession.id,
            title: data.title,
            fromUserId: userId,
            name: creator?.name ?? null,
          },
        });
      }
    }

    // Notify chabura members for chabura sessions
    if (data.type === "chabura" && data.chaburaId) {
      const members = await db()
        .select({ userId: chaburaMembers.userId })
        .from(chaburaMembers)
        .where(
          and(
            eq(chaburaMembers.chaburaId, data.chaburaId),
            eq(chaburaMembers.role, "member"),
          ),
        );

      for (const member of members) {
        if (member.userId === userId) continue;
        await db().insert(notifications).values({
          userId: member.userId,
          type: "session_invite",
          payload: {
            sessionId: learningSession.id,
            title: data.title,
            fromUserId: userId,
            name: creator?.name ?? null,
          },
        });
      }
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
    await db()
      .update(sessionOccurrences)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(sessionOccurrences.sessionId, sessionId),
          gt(sessionOccurrences.startsAt, now),
        ),
      );

    // Determine participants to notify
    if (ls) {
      const recipientIds: string[] = [];

      if (ls.type === "chavruta" && ls.chavrutaPairId) {
        const [conn] = await db()
          .select({ requesterId: connections.requesterId, addresseeId: connections.addresseeId })
          .from(connections)
          .where(eq(connections.id, ls.chavrutaPairId));
        if (conn) {
          const otherId = conn.requesterId === userId ? conn.addresseeId : conn.requesterId;
          recipientIds.push(otherId);
        }
      } else if (ls.type === "chabura" && ls.chaburaId) {
        const members = await db()
          .select({ userId: chaburaMembers.userId })
          .from(chaburaMembers)
          .where(eq(chaburaMembers.chaburaId, ls.chaburaId));
        recipientIds.push(...members.map((m) => m.userId).filter((id) => id !== userId));
      }

      for (const recipientId of recipientIds) {
        await db().insert(notifications).values({
          userId: recipientId,
          type: "session_cancelled",
          payload: { sessionId, title: ls.title ?? "A session" },
        });
      }
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

    return { success: true };
  } catch (error) {
    console.error("cancelOccurrence error:", error);
    return { success: false, error: "Failed to cancel occurrence" };
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

    const [occ] = await db()
      .select({ sessionId: sessionOccurrences.sessionId, startsAt: sessionOccurrences.startsAt })
      .from(sessionOccurrences)
      .where(eq(sessionOccurrences.id, occurrenceId));

    if (!occ) return { success: false, error: "Occurrence not found" };

    // Notes editable for 7 days after the session starts
    const sevenDaysAfter = new Date(occ.startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (new Date() > sevenDaysAfter) {
      return { success: false, error: "Notes can only be edited within 7 days of the session" };
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
