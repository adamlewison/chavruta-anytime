import { db } from "@/db";
import { learningSessions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

/** Learning sessions belonging to a chabura, oldest created first. */
export async function listChaburaSessions(chaburaId: string) {
  return db()
    .select({
      id: learningSessions.id,
      title: learningSessions.title,
      status: learningSessions.status,
      createdById: learningSessions.createdById,
      rrule: learningSessions.rrule,
      dtstart: learningSessions.dtstart,
      durationMin: learningSessions.durationMin,
      timezone: learningSessions.timezone,
    })
    .from(learningSessions)
    .where(eq(learningSessions.chaburaId, chaburaId))
    .orderBy(asc(learningSessions.createdAt));
}
