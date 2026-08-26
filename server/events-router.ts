import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { events } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assertPermission } from "./authorization";
import { logAudit } from "./audit";

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
});
