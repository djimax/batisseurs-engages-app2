import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "node:crypto";
import { getDb } from "./db";
import { eventRegistrations, events, members } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertPermission, userHasPermission } from "./authorization";
import { logAudit } from "./audit";
import { createUserNotification } from "./notification-center";

export const EventInput = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(255).optional(),
  eventType: z.enum(["reunion", "formation", "activite", "evenement", "autre"]).default("autre"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#1a4d2e"),
  organizer: z.string().trim().max(255).optional(),
  attendees: z.number().int().min(0).max(100000).default(0),
  capacity: z.number().int().positive().max(100000).optional(),
}).superRefine((value, ctx) => {
  if (new Date(value.endDate) <= new Date(value.startDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "La fin doit être postérieure au début" });
  }
});

const EventId = z.object({ id: z.number().int().positive() });
  const RegistrationInput = z.object({ eventId: z.number().int().positive(), memberId: z.number().int().positive() });
const RegistrationId = z.object({ registrationId: z.number().int().positive() });
const AttendanceInput = RegistrationId.extend({ status: z.enum(["registered", "attended", "cancelled"]) });
const AttendanceTokenInput = z.object({ token: z.string().trim().min(32).max(128), memberId: z.number().int().positive() });

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
  return db;
}

export const eventsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await requireDb();
    return db.select().from(events);
  }),

  create: protectedProcedure.input(EventInput).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await requireDb();
    const [result] = await db.insert(events).values({ ...input, createdBy: ctx.user.id });
    const id = Number(result.insertId);
    await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "event", entityId: id });
    return { id };
  }),

  update: protectedProcedure.input(EventInput.merge(EventId)).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await requireDb();
    const { id, ...data } = input;
    const [result] = await db.update(events).set(data).where(eq(events.id, id));
    if (result.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
    await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "event", entityId: id });
    return { id };
  }),

  delete: protectedProcedure.input(EventId).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await requireDb();
    const eventRows = await db.select({ id: events.id, title: events.title }).from(events).where(eq(events.id, input.id)).limit(1);
    const event = eventRows[0];
    if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
    const registrations = await db.select({ registration: eventRegistrations, member: members })
      .from(eventRegistrations).innerJoin(members, eq(eventRegistrations.memberId, members.id))
      .where(eq(eventRegistrations.eventId, input.id));
    await Promise.all(registrations.filter(({ member }) => member.userId).map(({ registration, member }) => createUserNotification({
      userId: member.userId!, title: "Événement supprimé", message: `L’événement « ${event.title} » a été supprimé.`, type: "warning", actionUrl: "/events", eventKey: "event.deleted", entityType: "event", entityId: input.id, dedupeKey: `event-deleted:${input.id}:${registration.id}`,
    })));
    await db.delete(eventRegistrations).where(eq(eventRegistrations.eventId, input.id));
    const [result] = await db.delete(events).where(eq(events.id, input.id));
    if (result.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
    await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "event", entityId: input.id, description: `${registrations.length} inscription(s) supprimée(s)` });
    return { id: input.id, registrationsDeleted: registrations.length };
  }),

  registrations: protectedProcedure.input(EventId).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await requireDb();
    return db.select({ registration: eventRegistrations, member: members })
      .from(eventRegistrations)
      .innerJoin(members, eq(eventRegistrations.memberId, members.id))
      .where(eq(eventRegistrations.eventId, input.id));
  }),

  register: protectedProcedure.input(RegistrationInput).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await requireDb();
    const event = await db.select({ id: events.id, title: events.title, capacity: events.capacity }).from(events).where(eq(events.id, input.eventId)).limit(1);
    if (!event[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
    const member = await db.select().from(members).where(eq(members.id, input.memberId)).limit(1);
    if (!member[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
    const canManageRegistrations = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, "structures.manage");
    if (!canManageRegistrations && member[0].userId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez inscrire que votre propre profil." });
    }
    const existing = await db.select().from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, input.eventId), eq(eventRegistrations.memberId, input.memberId))).limit(1);
    if (existing[0] && existing[0].status !== "cancelled") {
      throw new TRPCError({ code: "CONFLICT", message: "Ce membre est déjà inscrit à cet événement." });
    }
    const activeRegistrations = await db.select({ id: eventRegistrations.id, status: eventRegistrations.status }).from(eventRegistrations).where(and(eq(eventRegistrations.eventId, input.eventId), eq(eventRegistrations.status, "registered")));
    const nextStatus = event[0].capacity && activeRegistrations.length >= event[0].capacity ? "waitlisted" : "registered";
    if (existing[0]) {
      await db.update(eventRegistrations).set({ status: nextStatus, registeredAt: new Date().toISOString(), attendedAt: null, createdBy: ctx.user.id }).where(eq(eventRegistrations.id, existing[0].id));
      await logAudit({ userId: ctx.user.id, action: "REGISTER", entityType: "event_registration", entityId: existing[0].id, description: nextStatus === "waitlisted" ? "Inscription placée en liste d’attente" : "Inscription réactivée", newValue: nextStatus });
      if (member[0].userId) await createUserNotification({ userId: member[0].userId, title: nextStatus === "waitlisted" ? "Liste d’attente" : "Inscription confirmée", message: nextStatus === "waitlisted" ? `L’événement « ${event[0].title} » est complet. Vous êtes ajouté à la liste d’attente.` : `Votre inscription à l’événement « ${event[0].title} » est confirmée.`, type: nextStatus === "waitlisted" ? "info" : "success", actionUrl: "/events", eventKey: "event.registration", entityType: "event_registration", entityId: existing[0].id, dedupeKey: `event-registration:${existing[0].id}:${nextStatus}:${Date.now()}` });
      return { id: existing[0].id, status: nextStatus };
    }
    const [result] = await db.insert(eventRegistrations).values({ ...input, status: nextStatus, registeredAt: new Date().toISOString(), createdBy: ctx.user.id });
    const id = Number(result.insertId);
    await logAudit({ userId: ctx.user.id, action: "REGISTER", entityType: "event_registration", entityId: id, description: nextStatus === "waitlisted" ? "Inscription placée en liste d’attente" : "Inscription confirmée", newValue: nextStatus });
    if (member[0].userId) await createUserNotification({ userId: member[0].userId, title: nextStatus === "waitlisted" ? "Liste d’attente" : "Inscription confirmée", message: nextStatus === "waitlisted" ? `L’événement « ${event[0].title} » est complet. Vous êtes ajouté à la liste d’attente.` : `Votre inscription à l’événement « ${event[0].title} » est confirmée.`, type: nextStatus === "waitlisted" ? "info" : "success", actionUrl: "/events", eventKey: "event.registration", entityType: "event_registration", entityId: id, dedupeKey: `event-registration:${id}:${nextStatus}` });
    return { id, status: nextStatus };
  }),

  cancelRegistration: protectedProcedure.input(RegistrationId).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await requireDb();
    const rows = await db.select({ registration: eventRegistrations, member: members, event: events })
      .from(eventRegistrations)
      .innerJoin(members, eq(eventRegistrations.memberId, members.id))
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.id, input.registrationId)).limit(1);
    const row = rows[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Inscription introuvable" });
    const canManageRegistrations = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, "structures.manage");
    if (!canManageRegistrations && row.member.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez annuler que votre propre inscription." });
    await db.update(eventRegistrations).set({ status: "cancelled", attendedAt: null }).where(eq(eventRegistrations.id, input.registrationId));
    await logAudit({ userId: ctx.user.id, action: "CANCEL", entityType: "event_registration", entityId: input.registrationId });
    if (row.member.userId) await createUserNotification({ userId: row.member.userId, title: "Inscription annulée", message: `Votre inscription à l’événement « ${row.event.title} » a été annulée.`, type: "warning", actionUrl: "/events", eventKey: "event.registration.cancelled", entityType: "event_registration", entityId: input.registrationId, dedupeKey: `event-registration:${input.registrationId}:cancelled:${Date.now()}` });
    return { id: input.registrationId };
  }),

  generateAttendanceToken: protectedProcedure.input(EventId).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await requireDb();
    const event = await db.select({ id: events.id, title: events.title }).from(events).where(eq(events.id, input.id)).limit(1);
    if (!event[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db.update(events).set({ attendanceToken: token, attendanceTokenExpiresAt: expiresAt, attendanceTokenRevoked: 0 }).where(eq(events.id, input.id));
    await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "event_attendance_token", entityId: input.id, description: "Jeton QR d’émargement généré", newValue: JSON.stringify({ expiresAt }), status: "success" });
    return { eventId: input.id, token, expiresAt };
  }),

  revokeAttendanceToken: protectedProcedure.input(EventId).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await requireDb();
    await db.update(events).set({ attendanceTokenRevoked: 1 }).where(eq(events.id, input.id));
    await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "event_attendance_token", entityId: input.id, description: "Jeton QR d’émargement révoqué", status: "success" });
    return { success: true };
  }),

  checkInByToken: protectedProcedure.input(AttendanceTokenInput).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await requireDb();
    const rows = await db.select({ event: events, registration: eventRegistrations, member: members }).from(events).innerJoin(eventRegistrations, eq(eventRegistrations.eventId, events.id)).innerJoin(members, eq(eventRegistrations.memberId, members.id)).where(and(eq(events.attendanceToken, input.token), eq(eventRegistrations.memberId, input.memberId))).limit(1);
    const row = rows[0];
    if (!row || row.event.attendanceTokenRevoked || !row.event.attendanceTokenExpiresAt || new Date(row.event.attendanceTokenExpiresAt).getTime() < Date.now()) throw new TRPCError({ code: "FORBIDDEN", message: "Le QR d’émargement est invalide ou expiré." });
    const canManage = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, "structures.manage");
    if (!canManage && row.member.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez émarger que votre propre inscription." });
    if (row.registration.status === "cancelled" || row.registration.status === "waitlisted") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette inscription ne peut pas être émargée." });
    if (row.registration.status === "attended") return { id: row.registration.id, status: "attended" as const, alreadyCheckedIn: true };
    await db.update(eventRegistrations).set({ status: "attended", attendedAt: new Date().toISOString() }).where(eq(eventRegistrations.id, row.registration.id));
    await logAudit({ userId: ctx.user.id, action: "ATTENDANCE", entityType: "event_registration", entityId: row.registration.id, description: "Émargement QR validé", newValue: JSON.stringify({ eventId: row.event.id, memberId: row.member.id }), status: "success" });
    return { id: row.registration.id, status: "attended" as const, alreadyCheckedIn: false };
  }),

  markAttendance: protectedProcedure.input(AttendanceInput).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await requireDb();
    const rows = await db.select({ registration: eventRegistrations, member: members, event: events })
      .from(eventRegistrations)
      .innerJoin(members, eq(eventRegistrations.memberId, members.id))
      .innerJoin(events, eq(eventRegistrations.eventId, events.id))
      .where(eq(eventRegistrations.id, input.registrationId)).limit(1);
    const row = rows[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Inscription introuvable" });
    const [result] = await db.update(eventRegistrations).set({ status: input.status, attendedAt: input.status === "attended" ? new Date().toISOString() : null }).where(eq(eventRegistrations.id, input.registrationId));
    if (result.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Inscription introuvable" });
    await logAudit({ userId: ctx.user.id, action: "ATTENDANCE", entityType: "event_registration", entityId: input.registrationId, newValue: input.status });
    if (row.member.userId) {
      const label = input.status === "attended" ? "présence confirmée" : input.status === "cancelled" ? "inscription annulée" : "statut d’inscription rétabli";
      await createUserNotification({ userId: row.member.userId, title: "Mise à jour de votre événement", message: `Votre ${label} pour « ${row.event.title} ».`, type: input.status === "attended" ? "success" : "info", actionUrl: "/events", eventKey: "event.registration.status", entityType: "event_registration", entityId: input.registrationId, dedupeKey: `event-registration:${input.registrationId}:status:${input.status}:${Date.now()}` });
    }
    return { id: input.registrationId, status: input.status };
  }),
});
