"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { approveMember, declineMember } from "@/server/actions/chabura-membership";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

interface PendingMemberRowProps {
  chaburaId: string;
  userId: string;
  name: string | null;
  image: string | null;
}

function initials(name: string | null): string {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function PendingMemberRow({
  chaburaId,
  userId,
  name,
  image,
}: PendingMemberRowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);

  async function handleApprove() {
    setLoading("approve");
    const result = await approveMember(chaburaId, userId);
    if (result.success) {
      toast.success(`${name ?? "Member"} approved`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to approve");
    }
    setLoading(null);
  }

  async function handleDecline() {
    setLoading("decline");
    const result = await declineMember(chaburaId, userId);
    if (result.success) {
      toast.success(`Request declined`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to decline");
    }
    setLoading(null);
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
          <AvatarFallback className="text-sm">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <p className="flex-1 text-sm font-medium truncate">
          {name || "Anonymous"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-success border-success/30 hover:bg-success/10"
            onClick={handleApprove}
            disabled={loading !== null}
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleDecline}
            disabled={loading !== null}
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
