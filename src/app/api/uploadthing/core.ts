import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const f = createUploadthing();

export const ourFileRouter = {
  avatar: f(
    { image: { maxFileSize: "4MB", maxFileCount: 1 } },
    { awaitServerData: false },
  )
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        await db()
          .update(users)
          .set({ image: file.ufsUrl, updatedAt: new Date() })
          .where(eq(users.id, metadata.userId));
      } catch (error) {
        console.error("avatar onUploadComplete error:", error);
      }
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
