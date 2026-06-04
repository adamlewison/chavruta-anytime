"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  chaburas,
  chaburaMembers,
  conversations,
  conversationMembers,
  notifications,
  users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

export async function joinChabura(
  chaburaId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Check not already a member
    const [existing] = await db()
      .select()
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.chaburaId, chaburaId),
          eq(chaburaMembers.userId, userId),
        ),
      );

    if (existing) {
      return { success: false, error: "Already a member" };
    }

    // Get chabura details
    const [chabura] = await db()
      .select()
      .from(chaburas)
      .where(eq(chaburas.id, chaburaId));

    if (!chabura) {
      return { success: false, error: "Chabura not found" };
    }

    if (chabura.isPublic) {
      // Add as member directly
      await db().insert(chaburaMembers).values({
        chaburaId,
        userId,
        role: "member",
      });

      // Add to conversation
      const [conversation] = await db()
        .select()
        .from(conversations)
        .where(eq(conversations.chaburaId, chaburaId));

      if (conversation) {
        await db().insert(conversationMembers).values({
          conversationId: conversation.id,
          userId,
        });
      }
    } else {
      // Add as pending and notify the rosh
      await db().insert(chaburaMembers).values({
        chaburaId,
        userId,
        role: "pending",
      });

      if (chabura.roshChaburaId) {
        const [requester] = await db()
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, userId));

        await db().insert(notifications).values({
          userId: chabura.roshChaburaId,
          type: "chabura_request",
          payload: {
            chaburaId,
            chaburaSlug: chabura.slug,
            chaburaName: chabura.name,
            fromUserId: userId,
            name: requester?.name ?? null,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("joinChabura error:", error);
    return { success: false, error: "Failed to join chabura" };
  }
}

export async function declineMember(
  chaburaId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify current user is rosh
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
      .delete(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.chaburaId, chaburaId),
          eq(chaburaMembers.userId, userId),
        ),
      );

    return { success: true };
  } catch (error) {
    console.error("declineMember error:", error);
    return { success: false, error: "Failed to decline member" };
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

export async function leaveChabura(
  chaburaId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    const [membership] = await db()
      .select()
      .from(chaburaMembers)
      .where(and(eq(chaburaMembers.chaburaId, chaburaId), eq(chaburaMembers.userId, userId)));

    if (!membership) {
      return { success: false, error: "Not a member" };
    }

    if (membership.role === "rosh") {
      return { success: false, error: "Rosh cannot leave — transfer leadership first" };
    }

    await db()
      .delete(chaburaMembers)
      .where(and(eq(chaburaMembers.chaburaId, chaburaId), eq(chaburaMembers.userId, userId)));

    return { success: true };
  } catch (error) {
    console.error("leaveChabura error:", error);
    return { success: false, error: "Failed to leave chabura" };
  }
}

export async function approveMember(
  chaburaId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const currentUserId = session.user.id;

    // Verify current user is rosh
    const [membership] = await db()
      .select()
      .from(chaburaMembers)
      .where(
        and(
          eq(chaburaMembers.chaburaId, chaburaId),
          eq(chaburaMembers.userId, currentUserId),
        ),
      );

    if (!membership || membership.role !== "rosh") {
      return { success: false, error: "Not authorized" };
    }

    // Update member role from 'pending' to 'member'
    await db()
      .update(chaburaMembers)
      .set({ role: "member" })
      .where(
        and(
          eq(chaburaMembers.chaburaId, chaburaId),
          eq(chaburaMembers.userId, userId),
        ),
      );

    // Add them to the chabura conversation
    const [conversation] = await db()
      .select()
      .from(conversations)
      .where(eq(conversations.chaburaId, chaburaId));

    if (conversation) {
      await db().insert(conversationMembers).values({
        conversationId: conversation.id,
        userId,
      });
    }

    // Fetch chabura details for payload
    const [chabura] = await db()
      .select({ slug: chaburas.slug, name: chaburas.name })
      .from(chaburas)
      .where(eq(chaburas.id, chaburaId));

    // Notify the user
    await db().insert(notifications).values({
      userId,
      type: "chabura_invite",
      payload: {
        chaburaId,
        chaburaSlug: chabura?.slug ?? null,
        chaburaName: chabura?.name ?? null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("approveMember error:", error);
    return { success: false, error: "Failed to approve member" };
  }
}
