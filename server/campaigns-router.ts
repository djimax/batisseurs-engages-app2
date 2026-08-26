import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { campaigns } from "../drizzle/schema";
import { desc } from "drizzle-orm";
import { assertPermission } from "./authorization";

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
});
