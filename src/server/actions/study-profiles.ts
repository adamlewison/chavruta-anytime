"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { studyProfiles, subjects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type StudyProfileRow = {
  id: string;
  subjectId: string;
  subjectName: string;
  availabilityLocal: string;
  notes: string | null;
  active: boolean;
  createdAt: Date;
};

export type SubjectOption = {
  id: string;
  name: string;
  hebrewName: string | null;
};

export async function getStudyProfiles(): Promise<{
  profiles: StudyProfileRow[];
  subjects: SubjectOption[];
}> {
  const session = await auth();
  if (!session?.user?.id) return { profiles: [], subjects: [] };

  const [profiles, allSubjects] = await Promise.all([
    db()
      .select({
        id: studyProfiles.id,
        subjectId: studyProfiles.subjectId,
        subjectName: subjects.name,
        availabilityLocal: studyProfiles.availabilityLocal,
        notes: studyProfiles.notes,
        active: studyProfiles.active,
        createdAt: studyProfiles.createdAt,
      })
      .from(studyProfiles)
      .innerJoin(subjects, eq(studyProfiles.subjectId, subjects.id))
      .where(eq(studyProfiles.userId, session.user.id))
      .orderBy(studyProfiles.createdAt),
    db()
      .select({ id: subjects.id, name: subjects.name, hebrewName: subjects.hebrewName })
      .from(subjects)
      .orderBy(subjects.sortOrder),
  ]);

  return { profiles, subjects: allSubjects };
}

export async function createStudyProfile(data: {
  subjectId: string;
  availabilityLocal: string;
  availabilityUtc: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await db().insert(studyProfiles).values({
      userId: session.user.id,
      subjectId: data.subjectId,
      availabilityLocal: data.availabilityLocal,
      availabilityUtc: data.availabilityUtc,
      notes: data.notes?.trim() || null,
    });

    revalidatePath("/settings/learning-profiles");
    return { success: true };
  } catch (error) {
    console.error("createStudyProfile error:", error);
    return { success: false, error: "Failed to create profile" };
  }
}

export async function updateStudyProfile(data: {
  id: string;
  subjectId: string;
  availabilityLocal: string;
  availabilityUtc: string;
  notes?: string;
  active: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await db()
      .update(studyProfiles)
      .set({
        subjectId: data.subjectId,
        availabilityLocal: data.availabilityLocal,
        availabilityUtc: data.availabilityUtc,
        notes: data.notes?.trim() || null,
        active: data.active,
        updatedAt: new Date(),
      })
      .where(and(eq(studyProfiles.id, data.id), eq(studyProfiles.userId, session.user.id)));

    revalidatePath("/settings/learning-profiles");
    return { success: true };
  } catch (error) {
    console.error("updateStudyProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function deleteStudyProfile(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };

    await db()
      .delete(studyProfiles)
      .where(and(eq(studyProfiles.id, id), eq(studyProfiles.userId, session.user.id)));

    revalidatePath("/settings/learning-profiles");
    return { success: true };
  } catch (error) {
    console.error("deleteStudyProfile error:", error);
    return { success: false, error: "Failed to delete profile" };
  }
}
