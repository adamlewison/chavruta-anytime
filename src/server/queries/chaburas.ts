import { db } from "@/db";
import { chaburas, chaburaMembers, subjects, learningSessions, users } from "@/db/schema";
import { eq, and, asc, desc, inArray, notInArray, ilike, or, sql } from "drizzle-orm";

/** True when the slug is free for a new chabura. */
export async function isChaburaSlugAvailable(slug: string) {
  const [existing] = await db()
    .select({ id: chaburas.id })
    .from(chaburas)
    .where(eq(chaburas.slug, slug))
    .limit(1);
  return !existing;
}

/** Chabura core fields for the manage form, keyed by slug. */
export async function getChaburaForManage(slug: string) {
  const [row] = await db()
    .select({
      id: chaburas.id,
      slug: chaburas.slug,
      name: chaburas.name,
      description: chaburas.description,
      image: chaburas.image,
      isPublic: chaburas.isPublic,
    })
    .from(chaburas)
    .where(eq(chaburas.slug, slug));
  return row ?? null;
}

/** The caller's membership role in a chabura, or null if not a member. */
export async function getChaburaMembershipRole(chaburaId: string, userId: string) {
  const [row] = await db()
    .select({ role: chaburaMembers.role })
    .from(chaburaMembers)
    .where(
      and(
        eq(chaburaMembers.chaburaId, chaburaId),
        eq(chaburaMembers.userId, userId),
      ),
    );
  return row?.role ?? null;
}

/** Chabura name only, for <title> metadata. */
export async function getChaburaName(slug: string) {
  const [row] = await db()
    .select({ name: chaburas.name })
    .from(chaburas)
    .where(eq(chaburas.slug, slug));
  return row?.name ?? null;
}

/** Chabura detail joined to its subject (via any of its learning sessions), keyed by slug. */
export async function getChaburaDetailBySlug(slug: string) {
  const [row] = await db()
    .select({
      id: chaburas.id,
      slug: chaburas.slug,
      name: chaburas.name,
      description: chaburas.description,
      image: chaburas.image,
      isPublic: chaburas.isPublic,
      roshChaburaId: chaburas.roshChaburaId,
      subjectName: subjects.name,
      createdAt: chaburas.createdAt,
    })
    .from(chaburas)
    .leftJoin(learningSessions, eq(learningSessions.chaburaId, chaburas.id))
    .leftJoin(subjects, eq(subjects.id, learningSessions.subjectId))
    .where(eq(chaburas.slug, slug));
  return row ?? null;
}

/** Members of a chabura, joined to their user record, oldest join first. */
export async function getChaburaMembers(chaburaId: string) {
  return db()
    .select({
      userId: chaburaMembers.userId,
      role: chaburaMembers.role,
      name: users.name,
      image: users.image,
      joinedAt: chaburaMembers.joinedAt,
    })
    .from(chaburaMembers)
    .innerJoin(users, eq(users.id, chaburaMembers.userId))
    .where(eq(chaburaMembers.chaburaId, chaburaId))
    .orderBy(asc(chaburaMembers.joinedAt));
}

/** Ids of chaburas the user is an active (rosh or member) member of. */
export async function getUserChaburaMembershipIds(userId: string) {
  const rows = await db()
    .select({ chaburaId: chaburaMembers.chaburaId })
    .from(chaburaMembers)
    .where(
      and(
        eq(chaburaMembers.userId, userId),
        inArray(chaburaMembers.role, ["rosh", "member"]),
      ),
    );
  return rows.map((m) => m.chaburaId);
}

const chaburaMemberCountSql = sql<number>`(
  SELECT COUNT(*)::int FROM ${chaburaMembers}
  WHERE ${chaburaMembers.chaburaId} = ${chaburas.id}
    AND ${chaburaMembers.role} IN ('rosh', 'member')
)`;

/** Chaburas the caller belongs to, optionally filtered by name/description search. */
export async function listMyChaburas(chaburaIds: string[], search?: string) {
  if (chaburaIds.length === 0) return [];

  const searchFilter = search
    ? or(
        ilike(chaburas.name, `%${search}%`),
        ilike(chaburas.description, `%${search}%`),
      )
    : undefined;

  return db()
    .select({
      id: chaburas.id,
      slug: chaburas.slug,
      name: chaburas.name,
      description: chaburas.description,
      image: chaburas.image,
      isPublic: chaburas.isPublic,
      memberCount: chaburaMemberCountSql,
    })
    .from(chaburas)
    .where(
      and(
        inArray(chaburas.id, chaburaIds),
        ...(searchFilter ? [searchFilter] : []),
      ),
    )
    .orderBy(desc(chaburas.createdAt))
    .limit(50);
}

/** Public chaburas the caller does not already belong to, optionally search-filtered. */
export async function listDiscoverChaburas(excludeIds: string[], search?: string) {
  const searchFilter = search
    ? or(
        ilike(chaburas.name, `%${search}%`),
        ilike(chaburas.description, `%${search}%`),
      )
    : undefined;

  return db()
    .select({
      id: chaburas.id,
      slug: chaburas.slug,
      name: chaburas.name,
      description: chaburas.description,
      image: chaburas.image,
      isPublic: chaburas.isPublic,
      memberCount: chaburaMemberCountSql,
    })
    .from(chaburas)
    .where(
      and(
        eq(chaburas.isPublic, true),
        excludeIds.length > 0 ? notInArray(chaburas.id, excludeIds) : undefined,
        ...(searchFilter ? [searchFilter] : []),
      ),
    )
    .orderBy(desc(chaburas.createdAt))
    .limit(50);
}

/** Name + image for a chabura, for message-list display. */
export async function getChaburaNameImage(chaburaId: string) {
  const [row] = await db()
    .select({ name: chaburas.name, image: chaburas.image })
    .from(chaburas)
    .where(eq(chaburas.id, chaburaId));
  return row ?? null;
}

/** Name + image + slug for a chabura, for conversation-header display. */
export async function getChaburaNameImageSlug(chaburaId: string) {
  const [row] = await db()
    .select({ name: chaburas.name, image: chaburas.image, slug: chaburas.slug })
    .from(chaburas)
    .where(eq(chaburas.id, chaburaId));
  return row ?? null;
}

/** Id + name + image + slug for a chabura, for new-session context. */
export async function getChaburaContextInfo(chaburaId: string) {
  const [row] = await db()
    .select({ id: chaburas.id, name: chaburas.name, image: chaburas.image, slug: chaburas.slug })
    .from(chaburas)
    .where(eq(chaburas.id, chaburaId));
  return row ?? null;
}
