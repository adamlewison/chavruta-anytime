"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/empty-state";
import { ChaburasTable, type ChaburaRow } from "@/components/chaburas/chaburas-table";

export function ChaburasView({ chaburas }: { chaburas: ChaburaRow[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q ? chaburas.filter((r) => r.name.toLowerCase().includes(q)) : chaburas;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search chaburas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button asChild className="gap-2 bg-accent text-white hover:bg-accent/90 shrink-0">
          <Link href="/chaburas/new">
            <Plus className="h-4 w-4" />
            Create
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        q ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No chaburas match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <EmptyState
            heading="No chaburas yet"
            description="Gather learners around a shared topic and start your own chabura."
            action={{ label: "Start a Chabura", href: "/chaburas/new" }}
            letter="כ"
          />
        )
      ) : (
        <ChaburasTable chaburas={filtered} />
      )}
    </div>
  );
}
