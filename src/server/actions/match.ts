"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, userSubjects, connections, subjects } from "@/db/schema";
import { eq, ne, and, or, notInArray, sql } from "drizzle-orm";
import {
  findMatches,
  type MatchResult,
  type UserForMatching,
} from "@/lib/matching";

export async function getMatches(limit?: number): Promise<MatchResult[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;

    // Get current user
    const [currentUserRow] = await db()
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!currentUserRow || !currentUserRow.onboardedAt) {
      return [];
    }

    // Get current user's subjects
    const currentUserSubjects = await db()
      .select({
        subjectId: userSubjects.subjectId,
        subjectName: subjects.name,
        subjectHebrewName: subjects.hebrewName,
        level: userSubjects.level,
      })
      .from(userSubjects)
      .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
      .where(eq(userSubjects.userId, userId));

    // Get users to exclude (already connected or blocked)
    const existingConnections = await db()
      .select()
      .from(connections)
      .where(
        or(
          eq(connections.requesterId, userId),
          eq(connections.addresseeId, userId),
        ),
      );

    const excludeIds = new Set<string>([userId]);
    for (const conn of existingConnections) {
      if (
        conn.status === "accepted" ||
        conn.status === "blocked" ||
        conn.status === "pending"
      ) {
        excludeIds.add(
          conn.requesterId === userId ? conn.addresseeId : conn.requesterId,
        );
      }
    }

    // Query all other onboarded users
    const candidates = await db()
      .select()
      .from(users)
      .where(
        and(
          sql`${users.onboardedAt} IS NOT NULL`,
          notInArray(users.id, Array.from(excludeIds)),
        ),
      );

    // Get subjects for all candidates
    const candidateIds = candidates.map((c) => c.id);

    let candidateSubjectsMap = new Map<string, UserForMatching["subjects"]>();

    if (candidateIds.length > 0) {
      const allCandidateSubjects = await db()
        .select({
          userId: userSubjects.userId,
          subjectId: userSubjects.subjectId,
          subjectName: subjects.name,
          subjectHebrewName: subjects.hebrewName,
          level: userSubjects.level,
        })
        .from(userSubjects)
        .innerJoin(subjects, eq(userSubjects.subjectId, subjects.id))
        .where(notInArray(userSubjects.userId, [userId]));

      for (const row of allCandidateSubjects) {
        if (!candidateSubjectsMap.has(row.userId)) {
          candidateSubjectsMap.set(row.userId, []);
        }
        candidateSubjectsMap.get(row.userId)!.push({
          subjectId: row.subjectId,
          subjectName: row.subjectName,
          subjectHebrewName: row.subjectHebrewName,
          level: row.level,
        });
      }
    }

    // Build current user for matching
    const currentUser: UserForMatching = {
      id: currentUserRow.id,
      name: currentUserRow.name,
      image: currentUserRow.image,
      country: currentUserRow.country,
      languages: currentUserRow.languages ?? [],
      timezone: currentUserRow.timezone,
      bio: currentUserRow.bio,
      gender: currentUserRow.gender!,
      availability: currentUserRow.availability
        ? new Uint8Array(currentUserRow.availability)
        : null,
      onboardedAt: currentUserRow.onboardedAt,
      subjects: currentUserSubjects,
    };

    // Build candidate users for matching
    const candidateUsers: UserForMatching[] = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      image: c.image,
      country: c.country,
      languages: c.languages ?? [],
      timezone: c.timezone,
      bio: c.bio,
      gender: c.gender!,
      availability: c.availability ? new Uint8Array(c.availability) : null,
      onboardedAt: c.onboardedAt,
      subjects: candidateSubjectsMap.get(c.id) ?? [],
    }));

    return findMatches(currentUser, candidateUsers, limit ?? 20);
  } catch (error) {
    console.error("getMatches error:", error);
    return [];
  }
}
