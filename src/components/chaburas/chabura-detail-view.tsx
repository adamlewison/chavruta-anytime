"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { JoinButton } from "@/components/chaburas/join-button";
import { MembersTable } from "@/components/chaburas/members-table";
import { PendingMemberRow } from "@/components/chaburas/pending-member-row";
import { ManageChaburaForm } from "@/components/chaburas/manage-chabura-form";
import { SessionsTable, type SessionRow } from "@/components/sessions/sessions-table";
import { ChaburaGroupChat } from "@/components/chat/chabura-group-chat";
import { Plus } from "lucide-react";
import { Users, BookOpen, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type MembershipState = "none" | "pending" | "member" | "rosh";
type Section = "about" | "members" | "sessions" | "chat" | "manage";

function initialsOf(name: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

const BASE_SECTIONS: { id: Section; label: string }[] = [
  { id: "about", label: "About" },
  { id: "members", label: "Members" },
  { id: "sessions", label: "Sessions" },
  { id: "chat", label: "Chat" },
  { id: "manage", label: "Manage" },
];

export function ChaburaDetailView({
  chabura,
  visibleMembers,
  pendingMembers,
  conversationId,
  chatMessages,
  manageSessions,
  membershipState,
  currentUserId,
}: {
  chabura: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    image: string | null;
    isPublic: boolean | null;
    subjectName: string | null;
  };
  visibleMembers: Array<{
    userId: string;
    role: "rosh" | "member" | "pending";
    name: string | null;
    image: string | null;
  }>;
  pendingMembers: Array<{
    userId: string;
    role: "rosh" | "member" | "pending";
    name: string | null;
    image: string | null;
  }>;
  conversationId: string | null;
  chatMessages: Array<{
    id: string;
    senderId: string;
    senderName: string | null;
    body: string;
    createdAt: string;
  }>;
  manageSessions: SessionRow[];
  membershipState: MembershipState;
  currentUserId: string;
}) {
  const [section, setSection] = useState<Section>("about");

  const isRosh = membershipState === "rosh";
  const SECTIONS = BASE_SECTIONS.filter((s) => s.id !== "manage" || isRosh);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-4">
          {chabura.image ? (
            <Avatar className="h-16 w-16 rounded-xl">
              <AvatarImage src={chabura.image} alt={chabura.name} />
              <AvatarFallback className="rounded-xl text-xl">
                {initialsOf(chabura.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
              <BookOpen className="h-7 w-7 text-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{chabura.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {visibleMembers.length} member{visibleMembers.length !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {chabura.isPublic ? (
                  <><Globe className="h-4 w-4" /> Public</>
                ) : (
                  <><Lock className="h-4 w-4" /> Private</>
                )}
              </span>
              {chabura.subjectName && (
                <>
                  <span>·</span>
                  <Badge variant="secondary">{chabura.subjectName}</Badge>
                </>
              )}
            </div>
          </div>
        </div>

        <JoinButton
          chaburaId={chabura.id}
          initialState={membershipState}
          isPublic={chabura.isPublic ?? true}
        />
      </div>

      {/* Mobile: horizontal scrollable pill nav */}
      <nav className="md:hidden flex gap-1 overflow-x-auto pb-1 border-b border-border scrollbar-none mb-4">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              section === id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Desktop: sidebar + content */}
      <div className="flex gap-8">
        <nav className="hidden md:flex flex-col w-36 shrink-0 gap-0.5">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                section === id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* About */}
          {section === "about" && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <h2 className="font-semibold text-foreground">Description</h2>
                {chabura.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {chabura.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No description yet.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Members */}
          {section === "members" && (
            <>
              {visibleMembers.length > 0 ? (
                <MembersTable members={visibleMembers} chaburaId={chabura.id} isRosh={isRosh} />
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No members yet. Be the first to join!
                </p>
              )}

              {isRosh && pendingMembers.length > 0 && (
                <div className="pt-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Pending requests</h3>
                  {pendingMembers.map((m) => (
                    <PendingMemberRow
                      key={m.userId}
                      chaburaId={chabura.id}
                      userId={m.userId}
                      name={m.name}
                      image={m.image}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Sessions */}
          {section === "sessions" && (
            <div className="space-y-3">
              {isRosh && (
                <div className="flex justify-end">
                  <Link
                    href={`/sessions/new?chaburaId=${chabura.id}&name=${encodeURIComponent(chabura.name)}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                      "bg-accent text-white hover:bg-accent/90 transition-colors",
                    )}
                  >
                    <Plus className="h-4 w-4" /> New Session
                  </Link>
                </div>
              )}
              {manageSessions.length > 0 ? (
                <SessionsTable
                  sessions={manageSessions}
                  currentUserId={currentUserId}
                  canEdit={isRosh}
                />
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No sessions scheduled yet.
                </p>
              )}
            </div>
          )}

          {/* Chat */}
          {section === "chat" && (
            conversationId ? (
              <ChaburaGroupChat
                conversationId={conversationId}
                currentUserId={currentUserId}
                initialMessages={chatMessages}
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">
                {membershipState === "pending"
                  ? "Your request is pending approval."
                  : "Join this chabura to see the chat."}
              </p>
            )
          )}

          {/* Manage */}
          {section === "manage" && isRosh && (
            <ManageChaburaForm
              chaburaId={chabura.id}
              slug={chabura.slug}
              initialName={chabura.name}
              initialDescription={chabura.description ?? ""}
              initialImage={chabura.image}
              initialIsPublic={chabura.isPublic ?? true}
            />
          )}
        </div>
      </div>

    </div>
  );
}
