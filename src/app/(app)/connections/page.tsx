import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { connections, users, conversations, conversationMembers } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/empty-state";
import { ConnectionResponse } from "@/components/connections/connection-response";
import { MessageSquare, User, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Connections — ChavrutaAnytime",
};

export default async function ConnectionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  if (!session.user.onboardedAt) redirect("/onboarding");

  const userId = session.user.id;

  type ConnectionRow = {
    id: string;
    status: string;
    requesterId: string;
    addresseeId: string;
    otherName: string | null;
    otherImage: string | null;
    otherId: string;
    conversationId: string | null;
  };

  let accepted: ConnectionRow[] = [];
  let pendingReceived: ConnectionRow[] = [];
  let pendingSent: ConnectionRow[] = [];

  try {
    const rows = await db()
      .select({
        id: connections.id,
        status: connections.status,
        requesterId: connections.requesterId,
        addresseeId: connections.addresseeId,
        otherName: users.name,
        otherImage: users.image,
        otherId: users.id,
      })
      .from(connections)
      .innerJoin(
        users,
        or(
          and(eq(connections.requesterId, userId), eq(users.id, connections.addresseeId)),
          and(eq(connections.addresseeId, userId), eq(users.id, connections.requesterId)),
        )!,
      )
      .where(or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)));

    // Look up DM conversation IDs for accepted connections
    const myConvMemberships = await db()
      .select({ conversationId: conversationMembers.conversationId })
      .from(conversationMembers)
      .innerJoin(conversations, and(
        eq(conversations.id, conversationMembers.conversationId),
        eq(conversations.type, "dm"),
      ))
      .where(eq(conversationMembers.userId, userId));

    const myConvIds = myConvMemberships.map((m) => m.conversationId);

    // For each accepted connection, find the shared DM conversation
    const rowsWithConv = await Promise.all(
      rows.map(async (r) => {
        if (r.status !== "accepted") return { ...r, conversationId: null };
        // Find a conversation that both userId and otherId are members of
        let convId: string | null = null;
        for (const cid of myConvIds) {
          const [other] = await db()
            .select()
            .from(conversationMembers)
            .where(and(eq(conversationMembers.conversationId, cid), eq(conversationMembers.userId, r.otherId)));
          if (other) { convId = cid; break; }
        }
        return { ...r, conversationId: convId };
      }),
    );

    accepted = rowsWithConv.filter((r) => r.status === "accepted");
    pendingReceived = rowsWithConv.filter(
      (r) => r.status === "pending" && r.addresseeId === userId,
    );
    pendingSent = rowsWithConv.filter(
      (r) => r.status === "pending" && r.requesterId === userId,
    );
  } catch (err) {
    console.error("Connections query error:", err);
  }

  function initials(name: string | null) {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) ?? "?"
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        Connections
      </h1>

      <Tabs defaultValue="connections">
        <TabsList className="w-full">
          <TabsTrigger value="connections" className="flex-1">
            Connected {accepted.length > 0 && `(${accepted.length})`}
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending{" "}
            {pendingReceived.length > 0 && (
              <Badge className="ml-1.5 h-4 w-4 rounded-full p-0 text-[10px] bg-accent text-white justify-center">
                {pendingReceived.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex-1">
            Sent {pendingSent.length > 0 && `(${pendingSent.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Accepted connections */}
        <TabsContent value="connections" className="mt-4 space-y-3">
          {accepted.length === 0 ? (
            <EmptyState
              heading="No connections yet"
              description="Every chavruta starts somewhere. Find a learning partner today."
              action={{ label: "Find a Chavruta", href: "/find" }}
              letter="ק"
            />
          ) : (
            accepted.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={c.otherImage ?? undefined} />
                    <AvatarFallback>{initials(c.otherName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.otherName ?? "Partner"}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <Link href={c.conversationId ? `/messages/${c.conversationId}` : "/messages"}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        Message
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <Link href={`/sessions/new?type=chavruta&with=${c.id}`}>
                        <Calendar className="h-3.5 w-3.5" />
                        Schedule
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                      <Link href={`/profile/${c.otherId}`}>
                        <User className="h-3.5 w-3.5" />
                        Profile
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pending incoming */}
        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingReceived.length === 0 ? (
            <EmptyState
              heading="No pending requests"
              description="When someone sends you a connection request, it will appear here."
            />
          ) : (
            pendingReceived.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={c.otherImage ?? undefined} />
                    <AvatarFallback>{initials(c.otherName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.otherName ?? "Someone"}</p>
                    <p className="text-xs text-muted-foreground">
                      wants to learn with you
                    </p>
                  </div>
                  <ConnectionResponse connectionId={c.id} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Sent requests */}
        <TabsContent value="sent" className="mt-4 space-y-3">
          {pendingSent.length === 0 ? (
            <EmptyState
              heading="No sent requests"
              description="You haven't sent any requests yet."
              action={{ label: "Find Chavrutas", href: "/find" }}
            />
          ) : (
            pendingSent.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={c.otherImage ?? undefined} />
                    <AvatarFallback>{initials(c.otherName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.otherName ?? "Partner"}</p>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
