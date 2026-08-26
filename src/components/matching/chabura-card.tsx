"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { joinChabura } from "@/server/actions/chabura-membership";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus } from "lucide-react";
import type { listDiscoverChaburas } from "@/server/queries/chaburas";

type PublicChaburaResult = Awaited<ReturnType<typeof listDiscoverChaburas>>[number];

interface ChaburaCardProps {
  chabura: PublicChaburaResult;
}

export function ChaburaCard({ chabura }: ChaburaCardProps) {
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const initials = chabura.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await joinChabura(chabura.id);
      if (result.success) {
        setJoined(true);
        toast.success(`Joined ${chabura.name}!`);
      } else {
        toast.error(result.error ?? "Failed to join chabura");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="overflow-hidden border border-border/60 hover:border-accent/40 transition-all duration-200 hover:shadow-md">
      <CardContent className="p-0">
        <div className="px-5 pt-5 pb-4 flex gap-4 items-start">
          <Link href={`/chaburas/${chabura.slug}`} className="shrink-0">
            <Avatar className="h-16 w-16 ring-2 ring-background shadow-sm rounded-xl">
              <AvatarImage
                src={chabura.image ?? undefined}
                alt={chabura.name}
              />
              <AvatarFallback className="text-xl font-semibold bg-accent/10 text-accent rounded-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
            <Link
              href={`/chaburas/${chabura.slug}`}
              className="hover:underline underline-offset-2"
            >
              <h3 className="font-semibold text-base text-foreground truncate leading-tight">
                {chabura.name}
              </h3>
            </Link>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>
                {chabura.memberCount} member
                {chabura.memberCount !== 1 ? "s" : ""}
              </span>
            </div>

            {chabura.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {chabura.description}
              </p>
            )}
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          {joined ? (
            <Button disabled variant="outline" className="flex-1 gap-2">
              <Users className="h-4 w-4" />
              Joined
            </Button>
          ) : (
            <Button
              onClick={handleJoin}
              disabled={isJoining}
              className="flex-1 gap-2 bg-accent text-white hover:bg-accent/90"
            >
              <UserPlus className="h-4 w-4" />
              {isJoining ? "Joining…" : "Join Chabura"}
            </Button>
          )}
          <Button asChild variant="outline" size="default">
            <Link href={`/chaburas/${chabura.slug}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
