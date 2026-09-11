import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { campaigns, campaignContributions, users } from "../drizzle/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { assertPermission } from "./authorization";
import { z } from "zod";
import { nanoid } from "nanoid";
import { logAudit } from "./audit";
import { createUserNotification } from "./notification-center";

function toSafeAmount(value: string | number | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

export function calculateCampaignProgress(objectif: string | number | null | undefined, montantCollecte: string | number | null | undefined) {
  const safeObjective = toSafeAmount(objectif);
  const safeCollected = toSafeAmount(montantCollecte);
  return safeObjective > 0 ? Math.min(100, Math.round((safeCollected / safeObjective) * 100)) : 0;
}

export const campaignsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "finances.view");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

    const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
    return rows.map((campaign) => {
      const objectif = toSafeAmount(campaign.objectif);
      const montantCollecte = toSafeAmount(campaign.montantCollecte);
      const progress = calculateCampaignProgress(objectif, montantCollecte);
      return { ...campaign, objectif, montantCollecte, progress };
    });
  }),

  enableSharing: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "finances.manage");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1).then((rows) => rows[0]);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campagne introuvable" });
      if (campaign.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Seules les campagnes actives peuvent être partagées" });
      const publicToken = campaign.publicToken || nanoid(32);
      await db.update(campaigns).set({ publicToken, publicEnabled: 1 }).where(eq(campaigns.id, input.campaignId));
      await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "campaign", entityId: input.campaignId, entityName: campaign.title, description: "Partage public de campagne activé", status: "success" });
      return { publicToken, publicUrl: `/campaigns/public/${publicToken}` };
    }),

  disableSharing: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "finances.manage");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      await db.update(campaigns).set({ publicEnabled: 0 }).where(eq(campaigns.id, input.campaignId));
      await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "campaign", entityId: input.campaignId, description: "Partage public de campagne désactivé", status: "success" });
      return { success: true };
    }),

  getContributions: protectedProcedure
    .input(z.object({ campaignId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "finances.view");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      return db.select().from(campaignContributions).where(eq(campaignContributions.campaignId, input.campaignId)).orderBy(desc(campaignContributions.contributionDate));
    }),

  recordContribution: protectedProcedure
    .input(z.object({
      campaignId: z.number().int().positive(),
      displayName: z.string().trim().max(160).optional(),
      amount: z.string().regex(/^\d+(?:[.,]\d{1,2})?$/),
      currency: z.enum(["EUR", "XOF"]),
      status: z.enum(["pending", "completed", "failed", "refunded"]).default("completed"),
      reference: z.string().trim().min(3).max(120),
      paymentProvider: z.string().trim().max(60).optional(),
      paymentReference: z.string().trim().max(255).optional(),
      contributionDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "finances.manage");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const campaign = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId)).limit(1).then((rows) => rows[0]);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campagne introuvable" });
      const contribution = await db.insert(campaignContributions).values({ ...input, amount: input.amount.replace(",", "."), contributionDate: (input.contributionDate || new Date()).toISOString(), createdBy: ctx.user.id }).then(async (result) => db.select().from(campaignContributions).where(eq(campaignContributions.id, Number(result[0].insertId))).limit(1).then((rows) => rows[0]));
      const totals = await db.select({ total: sql<string>`coalesce(sum(case when ${campaignContributions.status} = 'completed' then cast(${campaignContributions.amount} as decimal(15,2)) else 0 end), 0)` }).from(campaignContributions).where(eq(campaignContributions.campaignId, input.campaignId));
      const collected = toSafeAmount(totals[0]?.total ?? "0");
      await db.update(campaigns).set({ montantCollecte: String(collected) }).where(eq(campaigns.id, input.campaignId));
      if (input.status === "completed") {
        const progress = calculateCampaignProgress(campaign.objectif, collected);
        const threshold = progress >= 100 ? 100 : progress >= 80 ? 80 : null;
        if (threshold) {
          const administrators = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
          const recipientIds = Array.from(new Set([ctx.user.id, ...administrators.map((administrator) => administrator.id)]));
          await Promise.all(recipientIds.map((userId) => createUserNotification({
            userId,
            title: threshold === 100 ? "Objectif de campagne atteint" : "Campagne proche de son objectif",
            message: `La campagne « ${campaign.title} » a atteint ${progress} % de son objectif.`,
            type: threshold === 100 ? "success" : "info",
            actionUrl: `/campaigns/${campaign.id}`,
            eventKey: "campaign_progress",
            entityType: "campaign",
            entityId: campaign.id,
            dedupeKey: `campaign-progress:${campaign.id}:${threshold}`,
          })));
        }
      }
      await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "campaign_contribution", entityId: contribution?.id, entityName: input.reference, description: `Contribution enregistrée pour « ${campaign.title} »`, newValue: JSON.stringify({ progress: calculateCampaignProgress(campaign.objectif, collected) }), status: "success" });
      return contribution;
    }),

  publicDetails: publicProcedure
    .input(z.object({ token: z.string().trim().min(20).max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const campaign = await db.select({ id: campaigns.id, title: campaigns.title, description: campaigns.description, objectif: campaigns.objectif, montantCollecte: campaigns.montantCollecte, dateDebut: campaigns.dateDebut, dateFin: campaigns.dateFin, status: campaigns.status, image: campaigns.image }).from(campaigns).where(and(eq(campaigns.publicToken, input.token), eq(campaigns.publicEnabled, 1), eq(campaigns.status, "active"))).limit(1).then((rows) => rows[0]);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campagne non disponible" });
      const contributions = await db.select({ id: campaignContributions.id, displayName: campaignContributions.displayName, amount: campaignContributions.amount, currency: campaignContributions.currency, contributionDate: campaignContributions.contributionDate }).from(campaignContributions).where(and(eq(campaignContributions.campaignId, campaign.id), eq(campaignContributions.status, "completed"))).orderBy(desc(campaignContributions.contributionDate));
      return { ...campaign, objectif: toSafeAmount(campaign.objectif), montantCollecte: toSafeAmount(campaign.montantCollecte), progress: calculateCampaignProgress(campaign.objectif, campaign.montantCollecte), contributions };
    }),
});
