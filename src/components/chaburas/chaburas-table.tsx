"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, MoreHorizontal, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { leaveChabura } from "@/server/actions/chabura-membership";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type ChaburaRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  isPublic: boolean | null;
  memberCount: number;
};

export function ChaburasTable({ chaburas }: { chaburas: ChaburaRow[] }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState<string | null>(null);

  async function handleLeave(chaburaId: string) {
    setLeaving(chaburaId);
    const result = await leaveChabura(chaburaId);
    if (result.success) {
      toast.success("Left chabura.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Something went wrong");
    }
    setLeaving(null);
  }

  return (
    <div className="rounded-lg border overflow-hidden divide-y divide-border">
      {chaburas.map((chabura) => (
        <div key={chabura.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {chabura.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={chabura.image}
                alt={chabura.name}
                className="h-11 w-11 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-4 w-4 text-accent" />
              </div>
            )}
            <Link
              href={`/chaburas/${chabura.slug}`}
              className="font-medium truncate hover:underline underline-offset-2"
            >
              {chabura.name}
            </Link>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                disabled={leaving === chabura.id}
                onClick={() => handleLeave(chabura.id)}
              >
                {leaving === chabura.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Leave chabura
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
