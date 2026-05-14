"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Filter sheet for /find.
 * Currently a stub — the full filter experience (subject, language, country,
 * level, sort) is rendered here. Filters are applied client-side via URL
 * search params in a future iteration; for now this shows the sheet chrome.
 */
export function FindFilterSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle>Filter Matches</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Filter by subject, language, and country — coming soon. Your current
            matches are already ranked by compatibility score.
          </p>
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Sort by
            </p>
            {["Best match", "Most overlap", "Newest"].map((label) => (
              <button
                key={label}
                className="w-full text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:border-accent/50 first:border-accent first:bg-accent/5 first:text-accent"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
