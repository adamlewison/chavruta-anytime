import { NextResponse } from "next/server";
import { getStudyMatchesForCurrentUser } from "@/server/queries/matches";

/**
 * GET /api/matches
 *
 * Fetches study matches for the currently authenticated user.
 * Returns an array of StudyMatchResult objects with matched subjects and scores.
 */
export async function GET() {
  try {
    const matches = await getStudyMatchesForCurrentUser();

    return NextResponse.json(
      {
        success: true,
        data: matches,
        count: matches.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API error fetching matches:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch study matches",
      },
      { status: 500 },
    );
  }
}
