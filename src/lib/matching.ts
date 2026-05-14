import { expandToUtcWeek, overlap, getNextSundayUtc } from "./availability";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublicUserView {
  id: string;
  name: string | null;
  image: string | null;
  country: string | null;
  languages: string[];
  timezone: string | null;
  bio: string | null;
}

export interface MatchHighlights {
  sharedSubjects: Array<{
    id: string;
    name: string;
    hebrewName: string | null;
  }>;
  sharedLanguages: string[];
  exactHoursPerWeek: number;
  nearHoursPerWeek: number;
  teachingComplement?: {
    mentor: "them" | "you";
    subject: { id: string; name: string };
  };
}

export interface MatchResult {
  user: PublicUserView;
  score: number;
  highlights: MatchHighlights;
}

export interface UserForMatching {
  id: string;
  name: string | null;
  image: string | null;
  country: string | null;
  languages: string[];
  timezone: string | null;
  bio: string | null;
  gender: "male" | "female";
  availability: Uint8Array | null;
  lastLoginAt?: Date | null;
  onboardedAt: Date | null;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    subjectHebrewName: string | null;
    level: "beginner" | "intermediate" | "advanced" | "teaching";
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jaccardIndex<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

/**
 * Compute the match score (0-100) between two users.
 * Returns null if any hard filter fails (the pair is unmatchable).
 */
export function computeScore(
  currentUser: UserForMatching,
  candidate: UserForMatching,
): { score: number; highlights: MatchHighlights } | null {
  // --- Hard filter 1: candidate must be onboarded ---
  if (candidate.onboardedAt === null) return null;

  // --- Hard filter 6: not self ---
  if (currentUser.id === candidate.id) return null;

  // --- Hard filter 2: same gender ---
  if (currentUser.gender !== candidate.gender) return null;

  // --- Hard filter 3: at least one shared language ---
  const currentLangs = new Set(currentUser.languages);
  const candidateLangs = new Set(candidate.languages);
  const sharedLanguages: string[] = [];
  for (const lang of currentLangs) {
    if (candidateLangs.has(lang)) sharedLanguages.push(lang);
  }
  if (sharedLanguages.length === 0) return null;

  // --- Hard filter 4: at least one shared subject ---
  const currentSubjectIds = new Set(
    currentUser.subjects.map((s) => s.subjectId),
  );
  const candidateSubjectIds = new Set(
    candidate.subjects.map((s) => s.subjectId),
  );
  const sharedSubjectIds: string[] = [];
  for (const id of currentSubjectIds) {
    if (candidateSubjectIds.has(id)) sharedSubjectIds.push(id);
  }
  if (sharedSubjectIds.length === 0) return null;

  // --- Hard filter 5: at least one shared availability slot ---
  let exactHours = 0;
  let nearHours = 0;

  if (
    currentUser.availability != null &&
    candidate.availability != null &&
    currentUser.timezone != null &&
    candidate.timezone != null
  ) {
    const weekStart = getNextSundayUtc();
    const currentUtc = expandToUtcWeek(
      currentUser.availability,
      currentUser.timezone,
      weekStart,
    );
    const candidateUtc = expandToUtcWeek(
      candidate.availability,
      candidate.timezone,
      weekStart,
    );
    const result = overlap(currentUtc, candidateUtc);
    exactHours = result.exactHours;
    nearHours = result.nearHours;
  }

  // Must have at least one overlapping slot (strict or fuzzy)
  if (exactHours === 0 && nearHours === 0) return null;

  // --- Scoring components ---

  // Subject overlap (Jaccard)
  const subjectOverlapJaccard = jaccardIndex(currentSubjectIds, candidateSubjectIds);

  // Exact hours normalized (capped at 10h)
  const exactHoursNormalized = Math.min(exactHours, 10) / 10;

  // Near hours normalized (capped at 8h)
  const nearHoursNormalized = Math.min(nearHours, 8) / 8;

  // Language overlap (Jaccard)
  const allLangs = new Set([...currentLangs, ...candidateLangs]);
  const languageOverlapJaccard = jaccardIndex(currentLangs, candidateLangs);

  // Teaching complement
  let teachingComplementScore = 0;
  let teachingComplement: MatchHighlights["teachingComplement"] | undefined;

  const candidateSubjectMap = new Map(
    candidate.subjects.map((s) => [s.subjectId, s]),
  );
  const currentSubjectMap = new Map(
    currentUser.subjects.map((s) => [s.subjectId, s]),
  );

  for (const subjectId of sharedSubjectIds) {
    const currentSubject = currentSubjectMap.get(subjectId)!;
    const candidateSubject = candidateSubjectMap.get(subjectId)!;

    // Candidate teaches, current user is beginner
    if (
      candidateSubject.level === "teaching" &&
      currentSubject.level === "beginner"
    ) {
      teachingComplementScore = 1;
      teachingComplement = {
        mentor: "them",
        subject: { id: subjectId, name: candidateSubject.subjectName },
      };
      break;
    }

    // Current user teaches, candidate is beginner
    if (
      currentSubject.level === "teaching" &&
      candidateSubject.level === "beginner"
    ) {
      teachingComplementScore = 1;
      teachingComplement = {
        mentor: "you",
        subject: { id: subjectId, name: currentSubject.subjectName },
      };
      break;
    }
  }

  // Country bonus
  const countrySameBonus =
    currentUser.country != null &&
    candidate.country != null &&
    currentUser.country === candidate.country
      ? 1
      : 0;

  // Recency bonus (logged in within 7 days)
  let recencyBonus = 0;
  if (candidate.lastLoginAt != null) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    recencyBonus = candidate.lastLoginAt.getTime() >= sevenDaysAgo ? 1 : 0;
  }

  // --- Final score ---
  const score =
    35 * subjectOverlapJaccard +
    25 * exactHoursNormalized +
    15 * nearHoursNormalized +
    10 * languageOverlapJaccard +
    8 * teachingComplementScore +
    4 * countrySameBonus +
    3 * recencyBonus;

  // --- Build highlights ---
  const sharedSubjects = sharedSubjectIds.map((id) => {
    const sub = candidateSubjectMap.get(id)!;
    return {
      id,
      name: sub.subjectName,
      hebrewName: sub.subjectHebrewName,
    };
  });

  const highlights: MatchHighlights = {
    sharedSubjects,
    sharedLanguages,
    exactHoursPerWeek: exactHours,
    nearHoursPerWeek: nearHours,
    ...(teachingComplement != null ? { teachingComplement } : {}),
  };

  return { score, highlights };
}

// ---------------------------------------------------------------------------
// Top-level match finder
// ---------------------------------------------------------------------------

/**
 * Score all candidates against the current user, filter out hard-filter
 * failures, sort by score (ties broken by most recent login), and return
 * the top `limit` results.
 */
export function findMatches(
  currentUser: UserForMatching,
  candidates: UserForMatching[],
  limit: number = 20,
): MatchResult[] {
  const scored: Array<{
    result: MatchResult;
    lastLogin: number;
  }> = [];

  for (const candidate of candidates) {
    const outcome = computeScore(currentUser, candidate);
    if (outcome == null) continue;

    scored.push({
      result: {
        user: {
          id: candidate.id,
          name: candidate.name,
          image: candidate.image,
          country: candidate.country,
          languages: candidate.languages,
          timezone: candidate.timezone,
          bio: candidate.bio,
        },
        score: outcome.score,
        highlights: outcome.highlights,
      },
      lastLogin: candidate.lastLoginAt?.getTime() ?? 0,
    });
  }

  // Sort descending by score; ties broken by most recent login
  scored.sort((a, b) => {
    if (b.result.score !== a.result.score) {
      return b.result.score - a.result.score;
    }
    return b.lastLogin - a.lastLogin;
  });

  return scored.slice(0, limit).map((s) => s.result);
}
