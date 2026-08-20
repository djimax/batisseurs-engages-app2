import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  assemblies,
  assemblyParticipants,
  assemblyProxies,
  assemblyResolutions,
  assemblyVotes,
  members,
} from "../drizzle/schema";
import { getDb } from "./db";
import { assertPermission } from "./authorization";
import { protectedProcedure, router } from "./_core/trpc";

export const assemblyCreateSchema = z.object({
  title: z.string().trim().min(3).max(255),
  description: z.string().trim().max(10_000).optional(),
  type: z.enum(["ordinary", "extraordinary"]).default("ordinary"),
  scheduledAt: z.string().min(1).optional(),
  opensAt: z.string().min(1).optional(),
  closesAt: z.string().min(1).optional(),
  quorumPercentage: z.number().int().min(1).max(100).default(50),
});

export function calculateQuorum(
  eligibleCount: number,
  presentCount: number,
  quorumPercentage: number,
) {
  const safeEligible = Math.max(0, eligibleCount);
  const safePresent = Math.max(0, Math.min(presentCount, safeEligible));
  const attendancePercentage = safeEligible === 0 ? 0 : (safePresent / safeEligible) * 100;
  return {
    eligibleCount: safeEligible,
    presentCount: safePresent,
    attendancePercentage: Number(attendancePercentage.toFixed(2)),
    requiredPercentage: quorumPercentage,
    reached: safeEligible > 0 && attendancePercentage >= quorumPercentage,
  };
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
  return db;
}

async function resolveMemberId(userId: number) {
  const db = await requireDb();
  const rows = await db.select({ id: members.id }).from(members).where(eq(members.userId, userId)).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Aucun profil membre n’est lié à ce compte." });
  return rows[0].id;
}

async function getAssemblyOrThrow(assemblyId: number) {
  const db = await requireDb();
  const rows = await db.select().from(assemblies).where(eq(assemblies.id, assemblyId)).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Assemblée introuvable." });
  return rows[0];
}

async function getResolutionOrThrow(resolutionId: number) {
  const db = await requireDb();
  const rows = await db.select().from(assemblyResolutions).where(eq(assemblyResolutions.id, resolutionId)).limit(1);
  if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Résolution introuvable." });
  return rows[0];
}

export const governanceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "governance.view");
    const db = await requireDb();
    return db.select().from(assemblies).orderBy(desc(assemblies.createdAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.view");
      const assembly = await getAssemblyOrThrow(input.id);
      const db = await requireDb();
      const participants = await db
        .select({
          id: assemblyParticipants.id,
          memberId: assemblyParticipants.memberId,
          attendance: assemblyParticipants.attendance,
          checkedInAt: assemblyParticipants.checkedInAt,
          firstName: members.firstName,
          lastName: members.lastName,
          email: members.email,
        })
        .from(assemblyParticipants)
        .leftJoin(members, eq(assemblyParticipants.memberId, members.id))
        .where(eq(assemblyParticipants.assemblyId, input.id));
      const resolutions = await db
        .select()
        .from(assemblyResolutions)
        .where(eq(assemblyResolutions.assemblyId, input.id))
        .orderBy(assemblyResolutions.orderIndex, assemblyResolutions.id);
      const resolutionIds = resolutions.map((resolution) => resolution.id);
      const votes = resolutionIds.length === 0
        ? []
        : await db.select().from(assemblyVotes).where(inArray(assemblyVotes.resolutionId, resolutionIds));
      const quorum = calculateQuorum(
        participants.length,
        participants.filter((participant) => participant.attendance === "present" || participant.attendance === "represented").length,
        assembly.quorumPercentage,
      );
      return {
        assembly,
        participants,
        quorum,
        resolutions: resolutions.map((resolution) => {
          const resolutionVotes = votes.filter((vote) => vote.resolutionId === resolution.id);
          return {
            ...resolution,
            results: {
              for: resolutionVotes.filter((vote) => vote.choice === "for").length,
              against: resolutionVotes.filter((vote) => vote.choice === "against").length,
              abstain: resolutionVotes.filter((vote) => vote.choice === "abstain").length,
              total: resolutionVotes.length,
            },
          };
        }),
      };
    }),

  create: protectedProcedure
    .input(assemblyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      const result = await db.insert(assemblies).values({
        title: input.title,
        description: input.description,
        type: input.type,
        scheduledAt: input.scheduledAt,
        opensAt: input.opensAt,
        closesAt: input.closesAt,
        quorumPercentage: input.quorumPercentage,
        createdBy: ctx.user.id,
      });
      return getAssemblyOrThrow(Number(result[0].insertId));
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      assemblyId: z.number().int().positive(),
      status: z.enum(["draft", "scheduled", "open", "closed", "archived"]),
      minutes: z.string().max(20_000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const assembly = await getAssemblyOrThrow(input.assemblyId);
      if (assembly.status === "closed" && input.status !== "archived") {
        throw new TRPCError({ code: "CONFLICT", message: "Une assemblée clôturée ne peut plus être rouverte." });
      }
      const db = await requireDb();
      await db.update(assemblies).set({ status: input.status, minutes: input.minutes ?? assembly.minutes }).where(eq(assemblies.id, input.assemblyId));
      if (input.status === "closed") {
        await db.update(assemblyResolutions).set({ status: "closed", closedAt: new Date().toISOString() }).where(and(eq(assemblyResolutions.assemblyId, input.assemblyId), eq(assemblyResolutions.status, "open")));
      }
      return getAssemblyOrThrow(input.assemblyId);
    }),

  addParticipant: protectedProcedure
    .input(z.object({ assemblyId: z.number().int().positive(), memberId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      await getAssemblyOrThrow(input.assemblyId);
      const db = await requireDb();
      const member = await db.select({ id: members.id, status: members.status }).from(members).where(eq(members.id, input.memberId)).limit(1);
      if (!member[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable." });
      if (member[0].status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Seuls les membres actifs peuvent être convoqués." });
      const existing = await db.select({ id: assemblyParticipants.id }).from(assemblyParticipants).where(and(eq(assemblyParticipants.assemblyId, input.assemblyId), eq(assemblyParticipants.memberId, input.memberId))).limit(1);
      if (existing[0]) return existing[0];
      const result = await db.insert(assemblyParticipants).values(input);
      return { id: Number(result[0].insertId), ...input };
    }),

  setAttendance: protectedProcedure
    .input(z.object({ assemblyId: z.number().int().positive(), memberId: z.number().int().positive(), attendance: z.enum(["invited", "present", "absent", "represented"]) }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      const existing = await db.select({ id: assemblyParticipants.id }).from(assemblyParticipants).where(and(eq(assemblyParticipants.assemblyId, input.assemblyId), eq(assemblyParticipants.memberId, input.memberId))).limit(1);
      if (!existing[0]) {
        const result = await db.insert(assemblyParticipants).values({ ...input, checkedInAt: input.attendance === "present" ? new Date().toISOString() : undefined });
        return { id: Number(result[0].insertId), ...input };
      }
      await db.update(assemblyParticipants).set({ attendance: input.attendance, checkedInAt: input.attendance === "present" ? new Date().toISOString() : null }).where(eq(assemblyParticipants.id, existing[0].id));
      return { id: existing[0].id, ...input };
    }),

  createResolution: protectedProcedure
    .input(z.object({ assemblyId: z.number().int().positive(), title: z.string().trim().min(3).max(255), description: z.string().trim().max(10_000).optional(), orderIndex: z.number().int().min(0).default(0) }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      await getAssemblyOrThrow(input.assemblyId);
      const db = await requireDb();
      const result = await db.insert(assemblyResolutions).values(input);
      return { id: Number(result[0].insertId), ...input, status: "draft" as const };
    }),

  updateResolutionStatus: protectedProcedure
    .input(z.object({ resolutionId: z.number().int().positive(), status: z.enum(["draft", "open", "closed"]) }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const resolution = await getResolutionOrThrow(input.resolutionId);
      const assembly = await getAssemblyOrThrow(resolution.assemblyId);
      if (input.status === "open" && assembly.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "L’assemblée doit être ouverte avant le vote." });
      if (resolution.status === "closed" && input.status !== "closed") throw new TRPCError({ code: "CONFLICT", message: "Une résolution clôturée est immuable." });
      const db = await requireDb();
      await db.update(assemblyResolutions).set({ status: input.status, closedAt: input.status === "closed" ? new Date().toISOString() : resolution.closedAt }).where(eq(assemblyResolutions.id, input.resolutionId));
      return getResolutionOrThrow(input.resolutionId);
    }),

  submitProxy: protectedProcedure
    .input(z.object({ assemblyId: z.number().int().positive(), representedMemberId: z.number().int().positive(), proxyMemberId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      if (input.representedMemberId === input.proxyMemberId) throw new TRPCError({ code: "BAD_REQUEST", message: "Un membre ne peut pas être son propre mandataire." });
      const db = await requireDb();
      const result = await db.insert(assemblyProxies).values(input);
      return { id: Number(result[0].insertId), ...input, status: "pending" as const };
    }),

  approveProxy: protectedProcedure
    .input(z.object({ proxyId: z.number().int().positive(), status: z.enum(["approved", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      const proxy = await db.select().from(assemblyProxies).where(eq(assemblyProxies.id, input.proxyId)).limit(1);
      if (!proxy[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Procuration introuvable." });
      await db.update(assemblyProxies).set({ status: input.status }).where(eq(assemblyProxies.id, input.proxyId));
      await db.update(assemblyParticipants).set({ attendance: input.status === "approved" ? "represented" : "invited" }).where(and(eq(assemblyParticipants.assemblyId, proxy[0].assemblyId), eq(assemblyParticipants.memberId, proxy[0].representedMemberId)));
      return { ...proxy[0], status: input.status };
    }),

  castVote: protectedProcedure
    .input(z.object({ resolutionId: z.number().int().positive(), choice: z.enum(["for", "against", "abstain"]) }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.vote");
      const resolution = await getResolutionOrThrow(input.resolutionId);
      const assembly = await getAssemblyOrThrow(resolution.assemblyId);
      if (assembly.status !== "open" || resolution.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "Le vote n’est pas ouvert." });
      const memberId = await resolveMemberId(ctx.user.id);
      const db = await requireDb();
      const participant = await db.select().from(assemblyParticipants).where(and(eq(assemblyParticipants.assemblyId, assembly.id), eq(assemblyParticipants.memberId, memberId))).limit(1);
      if (!participant[0] || !["present", "represented"].includes(participant[0].attendance)) throw new TRPCError({ code: "FORBIDDEN", message: "Vous devez être présent ou représenté pour voter." });
      const previous = await db.select({ id: assemblyVotes.id }).from(assemblyVotes).where(and(eq(assemblyVotes.resolutionId, input.resolutionId), eq(assemblyVotes.memberId, memberId))).limit(1);
      if (previous[0]) throw new TRPCError({ code: "CONFLICT", message: "Vous avez déjà voté sur cette résolution." });
      const result = await db.insert(assemblyVotes).values({ resolutionId: input.resolutionId, memberId, choice: input.choice });
      return { id: Number(result[0].insertId), resolutionId: input.resolutionId, memberId, choice: input.choice };
    }),
});
