import Link from "next/link";
import type { getPublicProfileWithAvailability, listUserSubjectsWithHebrew } from "@/server/queries/profile";
import type { listChavrutaSessions } from "@/server/queries/sessions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heatmap } from "@/components/availability";
import { ConnectButton } from "@/components/matching/connect-button";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SessionsTable } from "@/components/sessions/sessions-table";
import { BookOpen, Plus } from "lucide-react";

type ViewedUser = NonNullable<Awaited<ReturnType<typeof getPublicProfileWithAvailability>>>;
type ViewedUserSubjects = Awaited<ReturnType<typeof listUserSubjectsWithHebrew>>;
type SharedSessions = Awaited<ReturnType<typeof listChavrutaSessions>>;

export type ProfileConnectionState = "none" | "pending_sent" | "pending_received" | "accepted";

export interface OverlapData {
  exactHours: number;
  nearHours: number;
  strictMask: Uint8Array;
  nearMask: Uint8Array;
}

export function ProfileView({
  userId,
  currentUserId,
  viewedUser,
  viewedUserSubjects,
  connectionState,
  connectionId,
  conversationId,
  sharedSessions,
  overlapData,
}: {
  userId: string;
  currentUserId: string;
  viewedUser: ViewedUser;
  viewedUserSubjects: ViewedUserSubjects;
  connectionState: ProfileConnectionState;
  connectionId: string | undefined;
  conversationId: string | undefined;
  sharedSessions: SharedSessions;
  overlapData: OverlapData | null;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <ProfileHeader
        name={viewedUser.name}
        image={viewedUser.image}
        bio={viewedUser.bio}
        country={viewedUser.country}
        languages={viewedUser.languages}
      />

      {/* Action buttons */}
      <ConnectButton
        userId={userId}
        userName={viewedUser.name}
        initialState={connectionState}
        connectionId={connectionId}
        conversationId={conversationId}
      />

      {/* Sessions Together — only shown to accepted connections */}
      {connectionState === "accepted" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Sessions Together
            </h2>
            <Button size="sm" asChild>
              <Link href={`/sessions/new?with=${connectionId}&type=chavruta&name=${encodeURIComponent(viewedUser.name ?? "")}`}>
                <Plus className="h-4 w-4 mr-1" />
                New Session
              </Link>
            </Button>
          </div>

          {sharedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions yet.</p>
          ) : (
            <SessionsTable
              sessions={sharedSessions}
              currentUserId={currentUserId}
            />
          )}
        </section>
      )}

      {/* Subjects */}
      {viewedUserSubjects.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Learning Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {viewedUserSubjects.map((subject, idx) => (
                <Badge key={idx} variant="secondary" className="gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  {subject.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Availability Overlap */}
      {overlapData && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Availability Overlap
            </h2>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Exact overlap: </span>
                <span className="font-medium">
                  {overlapData.exactHours}h/week
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Close match: </span>
                <span className="font-medium">
                  {overlapData.nearHours}h/week
                </span>
              </div>
            </div>
            <Separator />
            <Heatmap
              strictMask={overlapData.strictMask}
              nearMask={overlapData.nearMask}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
