import { db } from "@/db";
import { connections } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";

/** requesterId/addresseeId of a connection, by id, with no ownership check. */
export async function getConnectionPair(connectionId: string) {
  const [row] = await db()
    .select({
      requesterId: connections.requesterId,
      addresseeId: connections.addresseeId,
    })
    .from(connections)
    .where(eq(connections.id, connectionId));
  return row ?? null;
}

/** A connection by id, only if the given user is one of its two parties. */
export async function getConnectionForUser(connectionId: string, userId: string) {
  const [row] = await db()
    .select({
      id: connections.id,
      requesterId: connections.requesterId,
      addresseeId: connections.addresseeId,
    })
    .from(connections)
    .where(
      and(
        eq(connections.id, connectionId),
        or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)),
      ),
    );
  return row ?? null;
}
