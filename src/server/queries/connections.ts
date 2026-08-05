import { db } from "@/db";
import { connections, users } from "@/db/schema";
import { eq, and, or, count } from "drizzle-orm";

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

/** Number of pending connection requests waiting on the user's response. */
export async function getPendingConnectionCount(userId: string) {
  const [row] = await db()
    .select({ n: count() })
    .from(connections)
    .where(and(eq(connections.addresseeId, userId), eq(connections.status, "pending")));
  return row?.n ?? 0;
}

/** All connections (accepted or pending, either direction) involving the user, with the other party's name/image. */
export async function listConnectionsForUser(userId: string) {
  return db()
    .select({
      id: connections.id,
      status: connections.status,
      requesterId: connections.requesterId,
      addresseeId: connections.addresseeId,
      otherName: users.name,
      otherImage: users.image,
      otherId: users.id,
    })
    .from(connections)
    .innerJoin(
      users,
      or(
        and(eq(connections.requesterId, userId), eq(users.id, connections.addresseeId)),
        and(eq(connections.addresseeId, userId), eq(users.id, connections.requesterId)),
      )!,
    )
    .where(or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)));
}

/** The connection row between two specific users, in either direction. */
export async function getConnectionBetween(userIdA: string, userIdB: string) {
  const [row] = await db()
    .select()
    .from(connections)
    .where(
      or(
        and(eq(connections.requesterId, userIdA), eq(connections.addresseeId, userIdB)),
        and(eq(connections.requesterId, userIdB), eq(connections.addresseeId, userIdA)),
      ),
    );
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
