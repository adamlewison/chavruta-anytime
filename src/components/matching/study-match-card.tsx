"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { sendConnectionRequest } from "@/server/actions/connections";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Check, BookOpen, UserCheck, Inbox, Sparkles } from "lucide-react";
import type { FullStudyMatchResult } from "@/server/queries/matches";

function scoreColor(score: number): string {
  if (score >= 75) return "from-emerald-400 to-green-500";
  if (score >= 50) return "from-yellow-400 to-amber-500";
  if (score >= 25) return "from-orange-400 to-amber-500";
  return "from-red-400 to-orange-400";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Good";
  return "Fair";
}

function scoreLabelColor(score: number): string {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  if (score >= 25) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

interface StudyMatchCardProps {
  match: FullStudyMatchResult;
}

export function StudyMatchCard({ match }: StudyMatchCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    match.connection_status,
  );

  const score = Math.round(parseFloat(match.match_score) * 100);

  const initials =
    match.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await sendConnectionRequest(match.id);
      if (result.success) {
        setConnectionStatus("request_sent");
        toast.success(`Request sent to ${match.name ?? "user"}!`);
      } else {
        toast.error(result.error ?? "Failed to send request");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="overflow-hidden border border-border/60 hover:border-accent/40 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex gap-4 items-start">
          <Link href={`/find/${match.id}`} className="shrink-0">
            <Avatar className="h-20 w-20 ring-2 ring-background shadow-sm">
              <AvatarImage
                src={match.image ?? undefined}
                alt={match.name ?? "User"}
              />
              <AvatarFallback className="text-2xl font-semibold bg-accent/10 text-accent">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0 pt-0.5 space-y-2">
            {/* Name + country */}
            <div>
              <Link
                href={`/find/${match.id}`}
                className="hover:underline underline-offset-2"
              >
                <h3 className="font-semibold text-base text-foreground truncate leading-tight">
                  {match.name ?? "Anonymous"}
                </h3>
              </Link>
              {match.country && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <span
                    className={`fi fi-${match.country.toLowerCase()} shrink-0`}
                    style={{
                      width: "1.1rem",
                      height: "0.85rem",
                      display: "inline-block",
                      borderRadius: "0.2rem",
                    }}
                  />
                </span>
              )}
            </div>

            {match.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {match.bio}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 mx-5" />

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          {/* Match score row */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                Match score
              </span>
              <span className="flex items-baseline gap-0.5">
                <span
                  className={`text-sm font-bold tabular-nums leading-none ${scoreLabelColor(score)}`}
                >
                  {score}%
                </span>
                <span
                  className={`text-[10px] font-medium leading-none ml-1 ${scoreLabelColor(score)}`}
                >
                  · {scoreLabel(score)}
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${scoreColor(score)} transition-all duration-700`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          {match.matched_subject_names.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Topics in common</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {match.matched_subject_names.slice(0, 5).map((name, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs gap-1 py-0.5"
                  >
                    {match.matched_subject_hebrew_names[i] && (
                      <span className="font-serif opacity-70">
                        {match.matched_subject_hebrew_names[i]}
                      </span>
                    )}
                    {name}
                  </Badge>
                ))}
                {match.matched_subject_names.length > 5 && (
                  <Badge variant="outline" className="text-xs py-0.5">
                    +{match.matched_subject_names.length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="px-5 pb-5 flex gap-2">
          {connectionStatus === "connected" ? (
            <Button disabled variant="outline" className="flex-1 gap-2">
              <UserCheck className="h-4 w-4" />
              Connected
            </Button>
          ) : connectionStatus === "request_sent" ? (
            <Button disabled variant="outline" className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              Request Sent
            </Button>
          ) : connectionStatus === "request_received" ? (
            <Button asChild variant="outline" className="flex-1 gap-2">
              <Link href="/connections">
                <Inbox className="h-4 w-4" />
                Respond to Request
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 gap-2 bg-accent text-white hover:bg-accent/90"
            >
              <UserPlus className="h-4 w-4" />
              {isConnecting ? "Sending…" : "Request Connection"}
            </Button>
          )}
          <Button asChild variant="outline" size="default">
            <Link href={`/find/${match.id}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
