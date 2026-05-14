"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { signOutAction, deleteAccount } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogOut } from "lucide-react";

export function DangerZone() {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result && !result.success) {
        toast.error(result.error || "Failed to delete account");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleSignOut}
        disabled={isPending}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="block w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors">
            Delete Account
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account?</DialogTitle>
            <DialogDescription>
              This permanently deletes your profile, connections, and learning
              history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Yes, delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
