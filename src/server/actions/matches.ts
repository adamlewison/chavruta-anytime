import { auth } from "@/lib/auth";
import { db } from "@/db";

import { sql } from "drizzle-orm";
import { users } from "@/db/schema/users";

// 1. Declare the type returned by the Postgres function
export type StudyMatchResult = {
  candidate_user_id: string;
  candidate_name: string;
  matched_subject_names: string[];
  matched_subject_hebrew_names: string[];
  match_score: string;
};

export type FullStudyMatchResult = {
  id: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  gender: typeof users.$inferSelect["gender"];
  country: string | null;
  languages: string[];
  timezone: string | null;
  availability_utc: string[];
  matched_subject_names: string[];
  matched_subject_hebrew_names: (string | null)[];
  match_score: string;
  connection_status: "request_sent" | "request_received" | "connected" | "not_connected";
};

export async function getFullStudyMatches(
  userId: string,
): Promise<FullStudyMatchResult[]> {
  try {
    const query = sql`SELECT * FROM get_study_profile_matches(${userId})`;
    const result = await db().execute<FullStudyMatchResult>(query);

    return result.rows;
  } catch (error) {
    console.error("Failed to fetch full profile study matches:", error);
    throw new Error("Matchmaking failed temporarily.");
  }
}

/**
 * Fetches up to 50 curated study matches for a specific user
 */
export async function getStudyMatches(
  userId: string,
): Promise<StudyMatchResult[]> {
  try {
    const query = sql`SELECT * FROM get_study_profile_matches(${userId})`;
    const result = await db().execute<StudyMatchResult>(query);

    return result.rows;
  } catch (error) {
    console.error("Failed to fetch study matches:", error);
    throw new Error("Matchmaking failed temporarily.");
  }
}

export async function getStudyMatchesForCurrentUser(): Promise<
  FullStudyMatchResult[]
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return [];
    }
    return await getFullStudyMatches(session.user.id);
  } catch (error) {
    console.error("Error fetching matches for current user:", error);
    return [];
  }
}
