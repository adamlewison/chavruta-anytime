"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { joinChabura } from "@/server/actions/chabura-membership";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, Clock } from "lucide-react";

type MembershipState = "none" | "pending" | "member" | "rosh";

interface JoinButtonProps {
  chaburaId: string;
  initialState: MembershipState;
  isPublic: boolean;
}

export function JoinButton({
  chaburaId,
  initialState,
  isPublic,
}: JoinButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<MembershipState>(initialState);
  const [isPending, startTransition] = useTransition();

  const handleJoin = () => {
    startTransition(async () => {
      const result = await joinChabura(chaburaId);
      if (result.success) {
        setState(isPublic ? "member" : "pending");
        toast.success(
          isPublic ? "Welcome to the chabura!" : "Join request sent",
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to join chabura");
      }
    });
  };

  if (state === "rosh" || state === "member") {
    return (
      <Button className="gap-2" variant="outline" disabled>
        <Check className="h-4 w-4" />
        {state === "rosh" ? "You are the Rosh" : "You're a member"}
      </Button>
    );
  }

  if (state === "pending") {
    return (
      <Button className="gap-2" variant="outline" disabled>
        <Clock className="h-4 w-4" />
        Request pending approval
      </Button>
    );
  }

  return (
    <Button
      className="gap-2 bg-accent text-white hover:bg-accent/90"
      onClick={handleJoin}
      disabled={isPending}
    >
      <UserPlus className="h-4 w-4" />
      {isPending
        ? "Joining…"
        : isPublic
          ? "Join Chabura"
          : "Request to Join"}
    </Button>
  );
}
