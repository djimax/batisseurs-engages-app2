import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
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
}).superRefine((value, ctx) => {
  if (new Date(value.endDate) <= new Date(value.startDate)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "La fin doit être postérieure au début" });
  }
});

const EventId = z.object({ id: z.number().int().positive() });
const RegistrationInput = z.object({ eventId: z.number().int().positive(), memberId: z.number().int().positive() });
const RegistrationId = z.object({ registrationId: z.number().int().positive() });
const AttendanceInput = RegistrationId.extend({ status: z.enum(["registered", "attended", "cancelled"]) });

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
    const [result] = await db.delete(events).where(eq(events.id, input.id));
    if (result.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Événement introuvable" });
    await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "event", entityId: input.id });
    return { id: input.id };
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
    const event = await db.select({ id: events.id, title: events.title }).from(events).where(eq(events.id, input.eventId)).limit(1);
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
    if (existing[0]) {
      await db.update(eventRegistrations).set({ status: "registered", registeredAt: new Date().toISOString(), attendedAt: null, createdBy: ctx.user.id }).where(eq(eventRegistrations.id, existing[0].id));
      await logAudit({ userId: ctx.user.id, action: "REGISTER", entityType: "event_registration", entityId: existing[0].id, description: "Inscription réactivée" });
      if (member[0].userId) await createUserNotification({ userId: member[0].userId, title: "Inscription confirmée", message: `Votre inscription à l’événement « ${event[0].title} » est confirmée.`, type: "success", actionUrl: "/events", eventKey: "event.registration", entityType: "event_registration", entityId: existing[0].id, dedupeKey: `event-registration:${existing[0].id}:${new Date().toISOString()}` });
      return { id: existing[0].id };
    }
    const [result] = await db.insert(eventRegistrations).values({ ...input, registeredAt: new Date().toISOString(), createdBy: ctx.user.id });
    const id = Number(result.insertId);
    await logAudit({ userId: ctx.user.id, action: "REGISTER", entityType: "event_registration", entityId: id });
    if (member[0].userId) await createUserNotification({ userId: member[0].userId, title: "Inscription confirmée", message: `Votre inscription à l’événement « ${event[0].title} » est confirmée.`, type: "success", actionUrl: "/events", eventKey: "event.registration", entityType: "event_registration", entityId: id, dedupeKey: `event-registration:${id}:registered` });
    return { id };
  }),

  cancelRegistration: protectedProcedure.input(RegistrationId).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await requireDb();
    const rows = await db.select({ registration: eventRegistrations, member: members })
      .from(eventRegistrations).innerJoin(members, eq(eventRegistrations.memberId, members.id))
      .where(eq(eventRegistrations.id, input.registrationId)).limit(1);
    const row = rows[0];
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Inscription introuvable" });
    const canManageRegistrations = ctx.user.role === "admin" || await userHasPermission(ctx.user.id, "structures.manage");
    if (!canManageRegistrations && row.member.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Vous ne pouvez annuler que votre propre inscription." });
    await db.update(eventRegistrations).set({ status: "cancelled", attendedAt: null }).where(eq(eventRegistrations.id, input.registrationId));
    await logAudit({ userId: ctx.user.id, action: "CANCEL", entityType: "event_registration", entityId: input.registrationId });
    return { id: input.registrationId };
  }),

  markAttendance: protectedProcedure.input(AttendanceInput).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await requireDb();
    const [result] = await db.update(eventRegistrations).set({ status: input.status, attendedAt: input.status === "attended" ? new Date().toISOString() : null }).where(eq(eventRegistrations.id, input.registrationId));
    if (result.affectedRows === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Inscription introuvable" });
    await logAudit({ userId: ctx.user.id, action: "ATTENDANCE", entityType: "event_registration", entityId: input.registrationId, newValue: input.status });
    return { id: input.registrationId, status: input.status };
  }),
});
