"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/brand/empty-state";
import {
  AcceptedConnectionsTable,
  PendingReceivedTable,
  PendingSentTable,
  type ConnectionRow,
} from "@/components/connections/connections-table";
import { ChaburasTable, type ChaburaRow } from "@/components/chaburas/chaburas-table";

export function ConnectionsView({
  accepted,
  pendingReceived,
  pendingSent,
  myChaburas,
}: {
  accepted: ConnectionRow[];
  pendingReceived: ConnectionRow[];
  pendingSent: ConnectionRow[];
  myChaburas: ChaburaRow[];
}) {
  const [section, setSection] = useState<"chavrutas" | "chaburas">("chavrutas");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filterConnections = (rows: ConnectionRow[]) =>
    q ? rows.filter((r) => r.otherName?.toLowerCase().includes(q)) : rows;
  const filterChaburas = (rows: ChaburaRow[]) =>
    q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;

  const filteredAccepted = filterConnections(accepted);
  const filteredReceived = filterConnections(pendingReceived);
  const filteredSent = filterConnections(pendingSent);
  const filteredChaburas = filterChaburas(myChaburas);

  const pendingCount = pendingReceived.length;

  return (
    <div className="space-y-6">
      {/* Section heading switcher */}
      <div className="flex items-end gap-8 border-b border-border">
        <button
          onClick={() => { setSection("chavrutas"); setQuery(""); }}
          className={cn(
            "relative pb-3 text-2xl font-bold tracking-tight transition-colors",
            section === "chavrutas"
              ? "text-foreground after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-foreground after:rounded-full"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Chavrutas
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-semibold">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => { setSection("chaburas"); setQuery(""); }}
          className={cn(
            "relative pb-3 text-2xl font-bold tracking-tight transition-colors",
            section === "chaburas"
              ? "text-foreground after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-foreground after:rounded-full"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Chaburas
        </button>
      </div>

      {/* ── Chavrutas section ── */}
      {section === "chavrutas" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs defaultValue="connections">
            <TabsList className="w-full">
              <TabsTrigger value="connections" className="flex-1">
                Connected {filteredAccepted.length > 0 && `(${filteredAccepted.length})`}
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">
                Requests
                {filteredReceived.length > 0 && (
                  <Badge className="ml-1.5 h-4 w-4 rounded-full p-0 text-[10px] bg-accent text-white justify-center">
                    {filteredReceived.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1">
                Sent {filteredSent.length > 0 && `(${filteredSent.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="mt-4">
              {filteredAccepted.length === 0 ? (
                q ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No connections match &ldquo;{query}&rdquo;.
                  </p>
                ) : (
                  <EmptyState
                    heading="No connections yet"
                    description="Every chavruta starts somewhere. Find a learning partner today."
                    action={{ label: "Find a Chavruta", href: "/find" }}
                    letter="ק"
                  />
                )
              ) : (
                <AcceptedConnectionsTable rows={filteredAccepted} />
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {filteredReceived.length === 0 ? (
                q ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No pending requests match &ldquo;{query}&rdquo;.
                  </p>
                ) : (
                  <EmptyState
                    heading="No pending requests"
                    description="When someone sends you a connection request, it will appear here."
                  />
                )
              ) : (
                <PendingReceivedTable rows={filteredReceived} />
              )}
            </TabsContent>

            <TabsContent value="sent" className="mt-4">
              {filteredSent.length === 0 ? (
                q ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No sent requests match &ldquo;{query}&rdquo;.
                  </p>
                ) : (
                  <EmptyState
                    heading="No sent requests"
                    description="You haven't sent any requests yet."
                    action={{ label: "Find Chavrutas", href: "/find" }}
                  />
                )
              ) : (
                <PendingSentTable rows={filteredSent} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* ── Chaburas section ── */}
      {section === "chaburas" && (
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

          {filteredChaburas.length === 0 ? (
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
            <ChaburasTable chaburas={filteredChaburas} />
          )}
        </div>
      )}
    </div>
  );
}
