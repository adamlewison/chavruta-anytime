import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversations, conversationMembers, messages, users, chaburas } from "@/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/brand/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Messages — ChavrutaAnytime",
};

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const userId = session.user.id;

  type ConvRow = {
    conversationId: string;
    displayName: string | null;
    displayImage: string | null;
    type: "dm" | "chabura";
    lastBody: string | null;
    lastAt: Date | null;
    lastReadAt: Date | null;
  };

  const convs: ConvRow[] = [];

  try {
    const myMemberships = await db()
      .select({
        conversationId: conversationMembers.conversationId,
        lastReadAt: conversationMembers.lastReadAt,
        convType: conversations.type,
        chaburaId: conversations.chaburaId,
      })
      .from(conversationMembers)
      .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
      .where(eq(conversationMembers.userId, userId));

    for (const membership of myMemberships) {
      const cid = membership.conversationId;

      let displayName: string | null = null;
      let displayImage: string | null = null;

      if (membership.convType === "dm") {
        const [other] = await db()
          .select({ userId: conversationMembers.userId })
          .from(conversationMembers)
          .where(and(eq(conversationMembers.conversationId, cid), ne(conversationMembers.userId, userId)));

        if (!other) continue;

        const [otherUser] = await db()
          .select({ name: users.name, image: users.image })
          .from(users)
          .where(eq(users.id, other.userId));

        displayName = otherUser?.name ?? null;
        displayImage = otherUser?.image ?? null;
      } else {
        // chabura conversation — look up the chabura name
        if (!membership.chaburaId) continue;
        const [chabura] = await db()
          .select({ name: chaburas.name, image: chaburas.image })
          .from(chaburas)
          .where(eq(chaburas.id, membership.chaburaId));

        displayName = chabura?.name ?? null;
        displayImage = chabura?.image ?? null;
      }

      const [latest] = await db()
        .select({ body: messages.body, createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.conversationId, cid))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      convs.push({
        conversationId: cid,
        displayName,
        displayImage,
        type: membership.convType,
        lastBody: latest?.body ?? null,
        lastAt: latest?.createdAt ?? null,
        lastReadAt: membership.lastReadAt ?? null,
      });
    }

    convs.sort((a, b) => {
      if (!a.lastAt) return 1;
      if (!b.lastAt) return -1;
      return b.lastAt.getTime() - a.lastAt.getTime();
    });
  } catch (err) {
    console.error("Messages query error:", err);
  }

  function initials(name: string | null) {
    return (
      name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?"
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold text-foreground">Messages</h1>

      {convs.length === 0 ? (
        <EmptyState
          heading="No conversations yet"
          description="Connect with a chavruta to start chatting."
          action={{ label: "Find a Chavruta", href: "/find" }}
          letter="ח"
        />
      ) : (
        <div className="divide-y border rounded-xl overflow-hidden bg-card">
          {convs.map((c) => {
            const hasUnread =
              c.lastAt &&
              (!c.lastReadAt || c.lastAt > c.lastReadAt);

            return (
              <Link
                key={c.conversationId}
                href={`/messages/${c.conversationId}`}
                className="flex items-center gap-4 px-4 py-4 hover:bg-muted/40 transition-colors"
              >
                <Avatar className="h-11 w-11 shrink-0">
                  {c.displayImage && <AvatarImage src={c.displayImage} />}
                  <AvatarFallback>{initials(c.displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("font-medium truncate text-sm", hasUnread && "text-foreground font-semibold")}>
                      {c.displayName ?? (c.type === "chabura" ? "Chabura" : "Partner")}
                    </p>
                    {c.lastAt && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {c.lastAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs truncate mt-0.5", hasUnread ? "text-foreground" : "text-muted-foreground")}>
                    {c.lastBody ?? "No messages yet"}
                  </p>
                </div>
                {hasUnread && (
                  <div className="h-2.5 w-2.5 rounded-full bg-accent shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
