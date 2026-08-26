import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { adhesions, members, notificationPreferences, notifications } from "../drizzle/schema";

export type NotificationType = "info" | "warning" | "error" | "success";
export type NotificationPreferencesMap = Record<string, boolean>;

export function normalizeNotificationPreferences(value: unknown): NotificationPreferencesMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, enabled]) => [key, enabled !== false]));
}

export async function getOrCreateNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(notificationPreferences).values({ userId, inAppEnabled: 1, emailEnabled: 1, typePreferences: {} });
  const created = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId)).limit(1);
  return created[0];
}

export async function createUserNotification(input: {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string | null;
  eventKey?: string | null;
  entityType?: string | null;
  entityId?: number | null;
  dedupeKey?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (input.dedupeKey) {
    const duplicate = await db.select().from(notifications)
      .where(eq(notifications.dedupeKey, input.dedupeKey)).limit(1);
    if (duplicate[0]) return { created: false as const, notification: duplicate[0], reason: "duplicate" as const };
  }

  const preferences = await getOrCreateNotificationPreferences(input.userId);
  const typePreferences = normalizeNotificationPreferences(preferences?.typePreferences);
  if (preferences?.inAppEnabled === 0 || typePreferences[input.eventKey ?? input.type ?? "info"] === false) {
    return { created: false as const, notification: null, reason: "disabled" as const };
  }

  const inserted = await db.insert(notifications).values({
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
    isRead: 0,
    actionUrl: input.actionUrl ?? null,
    eventKey: input.eventKey ?? null,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    dedupeKey: input.dedupeKey ?? null,
  });
  const notificationId = Number(inserted[0].insertId);
  const created = await db.select().from(notifications).where(eq(notifications.id, notificationId)).limit(1);
  return { created: true as const, notification: created[0] ?? null, reason: "created" as const };
}

export async function listUserNotifications(input: {
  userId: number;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  const where = input.unreadOnly
    ? and(eq(notifications.userId, input.userId), eq(notifications.isRead, 0))
    : eq(notifications.userId, input.userId);
  const rows = await db.select().from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit)
    .offset(offset);
  const unread = await db.select({ count: sql<number>`count(*)` }).from(notifications)
    .where(and(eq(notifications.userId, input.userId), eq(notifications.isRead, 0)));
  return { notifications: rows, unreadCount: Number(unread[0]?.count ?? 0), limit, offset };
}

export async function markNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  return { success: true as const };
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: 1 })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
  return { success: true as const };
}

export function getMembershipReminderKind(input: { expiration: string; status: "active" | "expired" | "pending" }, now = new Date()) {
  if (input.status === "active") return null;
  const expiration = new Date(input.expiration);
  if (Number.isNaN(expiration.getTime())) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(today);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  if (expiration < today) return "overdue" as const;
  if (expiration <= inSevenDays) return "expiring_soon" as const;
  return null;
}

export async function generateMembershipReminderNotifications(
  now = new Date(),
  onCreated?: (input: { member: typeof members.$inferSelect; adhesion: typeof adhesions.$inferSelect; kind: "overdue" | "expiring_soon" }) => Promise<void>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select({ adhesion: adhesions, member: members })
    .from(adhesions)
    .innerJoin(members, eq(adhesions.memberId, members.id));
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!row.member.userId) continue;
    const kind = getMembershipReminderKind({ expiration: row.adhesion.dateExpiration, status: row.adhesion.status }, now);
    if (!kind) continue;
    const dayKey = new Date(now).toISOString().slice(0, 10);
    const result = await createUserNotification({
      userId: row.member.userId,
      title: kind === "overdue" ? "Cotisation en retard" : "Cotisation bientôt échue",
      message: kind === "overdue"
        ? `Votre adhésion ${row.adhesion.annee} est arrivée à échéance. Pensez à la renouveler.`
        : `Votre adhésion ${row.adhesion.annee} arrive bientôt à échéance le ${new Date(row.adhesion.dateExpiration).toLocaleDateString("fr-FR")} .`,
      type: kind === "overdue" ? "warning" : "info",
      actionUrl: "/members/adhesions",
      eventKey: kind === "overdue" ? "membership.overdue" : "membership.expiring",
      entityType: "adhesion",
      entityId: row.adhesion.id,
      dedupeKey: `membership:${row.adhesion.id}:${kind}:${dayKey}`,
    });
    if (result.created) {
      created += 1;
      if (onCreated) await onCreated({ member: row.member, adhesion: row.adhesion, kind });
    } else skipped += 1;
  }
  return { created, skipped, scanned: rows.length };
}

export async function updateNotificationPreferences(input: {
  userId: number;
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  typePreferences?: NotificationPreferencesMap;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const current = await getOrCreateNotificationPreferences(input.userId);
  await db.update(notificationPreferences).set({
    inAppEnabled: input.inAppEnabled === undefined ? current?.inAppEnabled ?? 1 : input.inAppEnabled ? 1 : 0,
    emailEnabled: input.emailEnabled === undefined ? current?.emailEnabled ?? 1 : input.emailEnabled ? 1 : 0,
    typePreferences: input.typePreferences ?? current?.typePreferences ?? {},
  }).where(eq(notificationPreferences.userId, input.userId));
  return getOrCreateNotificationPreferences(input.userId);
}
