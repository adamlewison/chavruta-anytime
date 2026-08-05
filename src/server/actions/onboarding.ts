"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import { users, userSubjects, subjects } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { completeOnboardingSchema } from "@/domain/schemas/onboarding";
import { firstError } from "@/domain/schemas/common";

export async function completeOnboarding(data: {
  name: string;
  bio: string;
  image: string | null;
  gender: "male" | "female";
  country: string;
  postCode: string;
  languages: string[];
  timezone: string;
  subjects: string[];
  availability: number[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = completeOnboardingSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const userId = session.user.id;

    // Update user profile
    await db()
      .update(users)
      .set({
        name: data.name,
        bio: data.bio,
        image: data.image,
        gender: data.gender,
        country: data.country,
        postCode: data.postCode,
        languages: data.languages,
        timezone: data.timezone,
        availability: Buffer.from(data.availability),
        onboardedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Delete existing user subjects and insert new ones
    await db().delete(userSubjects).where(eq(userSubjects.userId, userId));

    if (data.subjects.length > 0) {
      // Resolve subject slugs to UUIDs
      const subjectRows = await db()
        .select({ id: subjects.id, slug: subjects.slug })
        .from(subjects)
        .where(inArray(subjects.slug, data.subjects));
      const slugToId = new Map(subjectRows.map((r) => [r.slug, r.id]));

      const rows = data.subjects
        .filter((slug) => slugToId.has(slug))
        .map((slug) => ({
          userId,
          subjectId: slugToId.get(slug)!,
          level: "beginner" as const,
        }));

      if (rows.length > 0) {
        await db().insert(userSubjects).values(rows);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("completeOnboarding error:", error);
    return { success: false, error: "Failed to complete onboarding" };
  }
}
