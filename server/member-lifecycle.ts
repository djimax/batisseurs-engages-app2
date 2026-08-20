import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { memberHistory, memberStatuses, members } from "../drizzle/schema";

export const MEMBER_STATUSES = [
  "active",
  "inactive",
  "pending",
  "suspended",
  "resigned",
  "deceased",
  "archived",
] as const;

export const memberStatusSchema = z.enum(MEMBER_STATUSES);
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  pending: "En attente",
  suspended: "Suspendu",
  resigned: "Démissionnaire",
  deceased: "Décédé",
  archived: "Archivé",
};

export async function assertMemberExists(memberId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
  const rows = await db.select().from(members).where(eq(members.id, memberId)).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
  return { db, member: rows[0] };
}

export async function recordMemberHistory(input: {
  memberId: number;
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy?: number | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(memberHistory).values({
    memberId: input.memberId,
    fieldName: input.fieldName,
    oldValue: input.oldValue == null ? null : String(input.oldValue),
    newValue: input.newValue == null ? null : String(input.newValue),
    changedBy: input.changedBy ?? null,
  });
}

export async function recordMemberStatus(input: {
  memberId: number;
  status: MemberStatus;
  reason?: string | null;
  changedBy?: number | null;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(memberStatuses).values({
    memberId: input.memberId,
    status: input.status,
    reason: input.reason?.trim() || null,
    changedBy: input.changedBy ?? null,
  });
}

export async function getMemberHistory(memberId: number) {
  const { db } = await assertMemberExists(memberId);
  return db.select().from(memberHistory)
    .where(eq(memberHistory.memberId, memberId))
    .orderBy(desc(memberHistory.changedAt), desc(memberHistory.id));
}

export async function getMemberStatusHistory(memberId: number) {
  const { db } = await assertMemberExists(memberId);
  return db.select().from(memberStatuses)
    .where(eq(memberStatuses.memberId, memberId))
    .orderBy(desc(memberStatuses.changedAt), desc(memberStatuses.id));
}

export function getMemberDisplayStatus(status: string | null | undefined) {
  return status && status in MEMBER_STATUS_LABELS
    ? MEMBER_STATUS_LABELS[status as MemberStatus]
    : "Inconnu";
}

export function buildMemberCardPayload(member: {
  id: number;
  memberId: string | null;
  firstName: string;
  lastName: string;
  status: string;
  joinedAt: string;
}) {
  return JSON.stringify({
    type: "les-batisseurs-engages-member-card",
    memberId: member.id,
    memberCode: member.memberId,
    status: member.status,
    issuedAt: member.joinedAt,
  });
}
