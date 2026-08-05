"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChaburaSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    setValue(initialQuery);
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = value.trim();
      if (trimmed === (initialQuery ?? "")) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      startTransition(() => {
        router.replace(`/chaburas${params.toString() ? `?${params}` : ""}`);
      });
    }, 300);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search chaburas…"
        className="pl-9 pr-9"
        aria-busy={isPending}
      />
      {value && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => setValue("")}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
