"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { uuid } from "@/domain/schemas/common";
import { firstError } from "@/domain/schemas/common";

const updateUserAvatarImageSchema = z.object({
  userId: uuid,
  imageUrl: z.url(),
});

/** Sets the caller's avatar image. Caller (the avatar upload route) owns the session check. */
export async function updateUserAvatarImage(userId: string, imageUrl: string) {
  const parsed = updateUserAvatarImageSchema.safeParse({ userId, imageUrl });
  if (!parsed.success) throw new Error(firstError(parsed.error));

  await db()
    .update(users)
    .set({ image: imageUrl, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
