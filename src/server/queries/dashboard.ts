import { db } from "@/db";
import {
  learningSessions,
  sessionOccurrences,
  connections,
  chaburaMembers,
  chaburas,
  users,
} from "@/db/schema";
import { eq, and, gt, lt, lte, gte, or, inArray, count, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { DateTime } from "luxon";

export type DashboardConnection = {
  id: string;
  chavrutaUserId: string;
  name: string | null;
  image: string | null;
};

export type DashboardSession = {
  occurrenceId: string;
  sessionId: string;
  title: string | null;
  startsAt: Date;
  endsAt: Date;
  meetUrl: string | null;
  sessionMeetUrl: string | null;
  partnerName: string | null;
  partnerImage: string | null;
  partnerUserId: string | null;
  chaburaSlug: string | null;
};

export type DashboardChabura = {
  id: string;
  slug: string | null;
  name: string | null;
  image: string | null;
  memberCount: number;
};

export async function getUserTimezone(userId: string): Promise<string | null> {
  const row = await db()
    .select({ timezone: users.timezone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r) => r[0] ?? null);
  return row?.timezone ?? null;
}

export async function getAcceptedConnections(userId: string): Promise<DashboardConnection[]> {
  const requesterUser = alias(users, "requester_user");
  const addresseeUser = alias(users, "addressee_user");

  return db()
    .select({
      id: connections.id,
      chavrutaUserId: sql<string>`CASE WHEN ${connections.requesterId} = ${userId} THEN ${connections.addresseeId} ELSE ${connections.requesterId} END`,
      name: sql<string | null>`CASE WHEN ${connections.requesterId} = ${userId} THEN ${addresseeUser.name} ELSE ${requesterUser.name} END`,
      image: sql<string | null>`CASE WHEN ${connections.requesterId} = ${userId} THEN ${addresseeUser.image} ELSE ${requesterUser.image} END`,
    })
    .from(connections)
    .innerJoin(requesterUser, eq(requesterUser.id, connections.requesterId))
    .innerJoin(addresseeUser, eq(addresseeUser.id, connections.addresseeId))
    .where(
      and(
        or(eq(connections.requesterId, userId), eq(connections.addresseeId, userId)),
        eq(connections.status, "accepted"),
      ),
    );
}

export async function getUserChaburaIds(userId: string): Promise<string[]> {
  const rows = await db()
    .select({ chaburaId: chaburaMembers.chaburaId })
    .from(chaburaMembers)
    .where(
      and(
        eq(chaburaMembers.userId, userId),
        or(eq(chaburaMembers.role, "member"), eq(chaburaMembers.role, "rosh")),
      ),
    );

  return rows.map((r) => r.chaburaId);
}

export async function getDashboardSessions(
  userId: string,
  connIds: string[],
  chaburaIds: string[],
  now: DateTime,
): Promise<{ upcomingSessions: DashboardSession[]; nextSession: DashboardSession | null }> {
  const sevenDaysFromNow = now.plus({ days: 7 });

  const sessConn = alias(connections, "sess_conn");
  const sessReqUser = alias(users, "sess_req_user");
  const sessAddrUser = alias(users, "sess_addr_user");
  const sessChabura = alias(chaburas, "sess_chabura");

  const fields = {
    occurrenceId: sessionOccurrences.id,
    sessionId: sessionOccurrences.sessionId,
    title: learningSessions.title,
    startsAt: sessionOccurrences.startsAt,
    endsAt: sessionOccurrences.endsAt,
    meetUrl: sessionOccurrences.meetUrl,
    sessionMeetUrl: learningSessions.meetUrl,
    partnerName: sql<string | null>`CASE WHEN ${learningSessions.chaburaId} IS NOT NULL THEN ${sessChabura.name} WHEN ${sessConn.id} IS NOT NULL THEN CASE WHEN ${sessConn.requesterId} = ${userId} THEN ${sessAddrUser.name} ELSE ${sessReqUser.name} END ELSE NULL END`,
    partnerImage: sql<string | null>`CASE WHEN ${learningSessions.chaburaId} IS NOT NULL THEN ${sessChabura.image} WHEN ${sessConn.id} IS NOT NULL THEN CASE WHEN ${sessConn.requesterId} = ${userId} THEN ${sessAddrUser.image} ELSE ${sessReqUser.image} END ELSE NULL END`,
    partnerUserId: sql<string | null>`CASE WHEN ${learningSessions.chaburaId} IS NOT NULL THEN NULL WHEN ${sessConn.requesterId} = ${userId} THEN ${sessAddrUser.id} ELSE ${sessReqUser.id} END`,
    chaburaSlug: sql<string | null>`${sessChabura.slug}`,
  };

  const sessionFilter = or(
    eq(learningSessions.createdById, userId),
    connIds.length > 0 ? inArray(learningSessions.chavrutaPairId, connIds) : undefined,
    chaburaIds.length > 0 ? inArray(learningSessions.chaburaId, chaburaIds) : undefined,
  );

  const withJoins = (q: ReturnType<typeof db>) =>
    q
      .select(fields)
      .from(sessionOccurrences)
      .innerJoin(learningSessions, eq(sessionOccurrences.sessionId, learningSessions.id))
      .leftJoin(sessConn, eq(sessConn.id, learningSessions.chavrutaPairId))
      .leftJoin(sessReqUser, eq(sessReqUser.id, sessConn.requesterId))
      .leftJoin(sessAddrUser, eq(sessAddrUser.id, sessConn.addresseeId))
      .leftJoin(sessChabura, eq(sessChabura.id, learningSessions.chaburaId));

  const [occurrences, ongoingOccs] = await Promise.all([
    withJoins(db())
      .where(
        and(
          sessionFilter,
          eq(sessionOccurrences.status, "scheduled"),
          gt(sessionOccurrences.startsAt, now.toJSDate()),
          lt(sessionOccurrences.startsAt, sevenDaysFromNow.toJSDate()),
        ),
      )
      .orderBy(sessionOccurrences.startsAt)
      .limit(8),

    withJoins(db())
      .where(
        and(
          sessionFilter,
          eq(sessionOccurrences.status, "scheduled"),
          lte(sessionOccurrences.startsAt, now.toJSDate()),
          gte(sessionOccurrences.endsAt, now.toJSDate()),
        ),
      )
      .orderBy(sessionOccurrences.startsAt)
      .limit(1),
  ]);

  const upcomingSessions = (occurrences ?? []) as DashboardSession[];
  const nextSession = ((ongoingOccs?.[0] ?? upcomingSessions[0]) ?? null) as DashboardSession | null;

  return { upcomingSessions, nextSession };
}

export async function getDashboardChaburas(chaburaIds: string[]): Promise<DashboardChabura[]> {
  if (chaburaIds.length === 0) return [];

  const [chaburaRows, memberCounts] = await Promise.all([
    db()
      .select({ id: chaburas.id, slug: chaburas.slug, name: chaburas.name, image: chaburas.image })
      .from(chaburas)
      .where(inArray(chaburas.id, chaburaIds))
      .limit(4),

    db()
      .select({ chaburaId: chaburaMembers.chaburaId, memberCount: count(chaburaMembers.userId) })
      .from(chaburaMembers)
      .where(
        and(
          inArray(chaburaMembers.chaburaId, chaburaIds),
          or(eq(chaburaMembers.role, "member"), eq(chaburaMembers.role, "rosh")),
        ),
      )
      .groupBy(chaburaMembers.chaburaId),
  ]);

  const countMap = new Map(memberCounts.map((r) => [r.chaburaId, r.memberCount]));
  return chaburaRows.map((ch) => ({ ...ch, memberCount: countMap.get(ch.id) ?? 0 }));
}
