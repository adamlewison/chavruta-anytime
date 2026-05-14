"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  country?: string;
  timezone?: string;
  darkMode?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name.trim();
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.country !== undefined) updates.country = data.country;
    if (data.timezone !== undefined) updates.timezone = data.timezone;
    if (data.darkMode !== undefined) updates.darkMode = data.darkMode;

    await db()
      .update(users)
      .set(updates)
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("updateProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function updateAvailability(
  bitmapBase64: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const bytes = Buffer.from(bitmapBase64, "base64");
    if (bytes.length !== 42) {
      return { success: false, error: "Invalid availability data" };
    }

    await db()
      .update(users)
      .set({ availability: bytes, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("updateAvailability error:", error);
    return { success: false, error: "Failed to update availability" };
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db().delete(users).where(eq(users.id, session.user.id));
  } catch (error) {
    console.error("deleteAccount error:", error);
    return { success: false, error: "Failed to delete account" };
  }
  await signOut({ redirectTo: "/" });
  redirect("/");
}
