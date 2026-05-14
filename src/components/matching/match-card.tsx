"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sendConnectionRequest } from "@/server/actions/connections";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, ArrowRight, Sparkles } from "lucide-react";
import { languageName } from "@/lib/languages";

interface MatchCardProps {
  userId: string;
  name: string | null;
  image: string | null;
  score: number;
  sharedSubjects: Array<{ name: string }>;
  sharedLanguages: string[];
  exactHours: number;
  nearHours: number;
  teachingComplement?: { mentor: "them" | "you"; subject: { name: string } };
  bio: string | null;
}

export function MatchCard({
  userId,
  name,
  image,
  score,
  sharedSubjects,
  sharedLanguages,
  exactHours,
  nearHours,
  teachingComplement,
  bio,
}: MatchCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await sendConnectionRequest(userId);
      if (result.success) {
        setIsConnected(true);
        toast.success("Connection request sent!");
      } else {
        toast.error(result.error || "Failed to send connection request");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="hover:border-accent/50 transition-colors">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={image || undefined} alt={name || "User"} />
            <AvatarFallback className="text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">
                {name || "Anonymous"}
              </h3>
              <Badge variant="secondary" className="shrink-0">
                {Math.round(score)}% match
              </Badge>
            </div>
            {bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Shared Subjects */}
        {sharedSubjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Shared subjects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sharedSubjects.slice(0, 4).map((subject, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {subject.name}
                </Badge>
              ))}
              {sharedSubjects.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{sharedSubjects.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Languages & Availability */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {sharedLanguages.length > 0 && (
            <span>🗣️ {sharedLanguages.map(languageName).join(", ")}</span>
          )}
          {exactHours > 0 && <span>⏰ ~{exactHours}h exact overlap</span>}
          {nearHours > 0 && exactHours === 0 && (
            <span>⏰ ~{nearHours}h close overlap</span>
          )}
        </div>

        {/* Teaching Complement */}
        {teachingComplement && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
            <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              {teachingComplement.mentor === "them" ? (
                <>
                  <strong>{name}</strong> can teach you{" "}
                  <strong>{teachingComplement.subject.name}</strong>
                </>
              ) : (
                <>
                  You can teach <strong>{name}</strong>{" "}
                  <strong>{teachingComplement.subject.name}</strong>
                </>
              )}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleConnect}
            disabled={isConnecting || isConnected}
            className={isConnected ? "flex-1 gap-2" : "flex-1 gap-2 bg-accent text-white hover:bg-accent/90"}
            variant={isConnected ? "outline" : "default"}
          >
            <UserPlus className="h-4 w-4" />
            {isConnected ? "Request Sent" : "Connect"}
          </Button>
          <Button asChild variant="outline" size="icon">
            <Link href={`/find/${userId}`}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
