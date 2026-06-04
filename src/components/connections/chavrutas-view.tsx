"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/brand/empty-state";
import {
  AcceptedConnectionsTable,
  PendingReceivedTable,
  PendingSentTable,
  type ConnectionRow,
} from "@/components/connections/connections-table";

export function ChavrutasView({
  accepted,
  pendingReceived,
  pendingSent,
}: {
  accepted: ConnectionRow[];
  pendingReceived: ConnectionRow[];
  pendingSent: ConnectionRow[];
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filter = (rows: ConnectionRow[]) =>
    q ? rows.filter((r) => r.otherName?.toLowerCase().includes(q)) : rows;

  const filteredAccepted = filter(accepted);
  const filteredReceived = filter(pendingReceived);
  const filteredSent = filter(pendingSent);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="connections">
        <TabsList className="w-full">
          <TabsTrigger value="connections" className="flex-1">
            Connected{" "}
            {filteredAccepted.length > 0 && `(${filteredAccepted.length})`}
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

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

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
  );
}
