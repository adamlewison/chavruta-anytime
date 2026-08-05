"use server";

import { auth } from "@/server/auth";
import { db } from "@/db";
import { chaburas, chaburaMembers, conversations, conversationMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createChaburaSchema, updateChaburaSchema } from "@/domain/schemas/chaburas";
import { firstError } from "@/domain/schemas/common";

export async function createChabura(data: {
  name: string;
  description: string;
  slug: string;
  subjectId?: string;
  isPublic: boolean;
  image?: string;
}): Promise<{ success: boolean; slug?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = createChaburaSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    const userId = session.user.id;

    const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return { success: false, error: "Invalid slug" };

    // Check slug uniqueness
    const [existing] = await db()
      .select({ id: chaburas.id })
      .from(chaburas)
      .where(eq(chaburas.slug, slug))
      .limit(1);
    if (existing) return { success: false, error: "That name is already taken" };

    // Insert chabura
    const [chabura] = await db()
      .insert(chaburas)
      .values({
        slug,
        name: data.name,
        description: data.description,
        creatorId: userId,
        roshChaburaId: userId,
        isPublic: data.isPublic,
        image: data.image ?? null,
      })
      .returning();

    // Add creator as member with role 'rosh'
    await db().insert(chaburaMembers).values({
      chaburaId: chabura.id,
      userId,
      role: "rosh",
    });

    // Create chabura conversation
    const [conversation] = await db()
      .insert(conversations)
      .values({
        type: "chabura",
        chaburaId: chabura.id,
      })
      .returning();

    // Add creator to conversation
    await db().insert(conversationMembers).values({
      conversationId: conversation.id,
      userId,
    });

    return { success: true, slug };
  } catch (error) {
    console.error("createChabura error:", error);
    return { success: false, error: "Failed to create chabura" };
  }
}

export async function updateChabura(
  chaburaId: string,
  data: { name: string; description: string; isPublic?: boolean },
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const parsed = updateChaburaSchema.safeParse({ chaburaId, data });
    if (!parsed.success) return { success: false, error: firstError(parsed.error) };

    // Verify rosh
    const [membership] = await db()
      .select()
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.chaburaId, chaburaId),
          eq(chaburaMembers.userId, session.user.id),
        ),
      );

    if (!membership || membership.role !== "rosh") {
      return { success: false, error: "Not authorized" };
    }

    await db()
      .update(chaburas)
      .set({
        name: data.name,
        description: data.description,
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        updatedAt: new Date(),
      })
      .where(eq(chaburas.id, chaburaId));

    return { success: true };
  } catch (error) {
    console.error("updateChabura error:", error);
    return { success: false, error: "Failed to update chabura" };
  }
}

/**
 * Sets a chabura's avatar image. Caller (the avatar upload route) has already
 * verified the requester is rosh of this chabura before calling.
 */
export async function updateChaburaImage(chaburaId: string, imageUrl: string) {
  await db()
    .update(chaburas)
    .set({ image: imageUrl, updatedAt: new Date() })
    .where(eq(chaburas.id, chaburaId));
}
