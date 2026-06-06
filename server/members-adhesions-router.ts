import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { members, cotisations, adhesions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Procédures tRPC pour gérer les membres avec leurs adhésions
 * Intègre les données des tables members, cotisations et adhesions
 */

export const membersAdhesionsRouter = router({
  /**
   * Récupère un membre avec toutes ses adhésions et cotisations
   */
  getWithAdhesions: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Récupérer le membre
      const member = await db
        .select()
        .from(members)
        .where(eq(members.id, input.memberId))
        .limit(1);

      if (!member.length) {
        throw new Error("Member not found");
      }

      // Récupérer les cotisations
      const memberCotisations = await db
        .select()
        .from(cotisations)
        .where(eq(cotisations.memberId, input.memberId));

      // Récupérer les adhésions
      const memberAdhesions = await db
        .select()
        .from(adhesions)
        .where(eq(adhesions.memberId, input.memberId));

      // Déterminer le statut d'adhésion actuel
      const now = new Date();
      const activeAdhesion = memberAdhesions.find(
        (a) => new Date(a.dateExpiration) > now && a.status === "active"
      );

      const adhesionStatus = activeAdhesion
        ? "active"
        : memberAdhesions.length > 0
        ? "expired"
        : "never";

      return {
        member: member[0],
        cotisations: memberCotisations,
        adhesions: memberAdhesions,
        adhesionStatus,
        activeAdhesion: activeAdhesion || null,
      };
    }),

  /**
   * Récupère tous les membres avec leur statut d'adhésion
   */
  listWithAdhesionStatus: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allMembers = await db.select().from(members);
    const now = new Date();

    const membersWithStatus = await Promise.all(
      allMembers.map(async (member) => {
        const memberAdhesions = await db
          .select()
          .from(adhesions)
          .where(eq(adhesions.memberId, member.id));

        const activeAdhesion = memberAdhesions.find(
          (a) => new Date(a.dateExpiration) > now && a.status === "active"
        );

        const adhesionStatus = activeAdhesion
          ? "active"
          : memberAdhesions.length > 0
          ? "expired"
          : "never";

        return {
          ...member,
          adhesionStatus,
          lastAdhesionExpiration: memberAdhesions.length > 0
            ? new Date(
                Math.max(
                  ...memberAdhesions.map((a) =>
                    new Date(a.dateExpiration).getTime()
                  )
                )
              )
            : null,
        };
      })
    );

    return membersWithStatus;
  }),

  /**
   * Crée une adhésion pour un membre
   */
  createAdhesion: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        type: z.enum(["annuelle", "mensuelle", "trimestrielle", "semestrielle"]),
        montant: z.string(),
        dateDebut: z.date(),
        modePayment: z.enum(["virement", "especes", "cheque", "carte", "autre"]).optional(),
        referencePayment: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculer la date d'expiration basée sur le type
      const dateDebut = new Date(input.dateDebut);
      const dateExpiration = new Date(dateDebut);

      switch (input.type) {
        case "annuelle":
          dateExpiration.setFullYear(dateExpiration.getFullYear() + 1);
          break;
        case "semestrielle":
          dateExpiration.setMonth(dateExpiration.getMonth() + 6);
          break;
        case "trimestrielle":
          dateExpiration.setMonth(dateExpiration.getMonth() + 3);
          break;
        case "mensuelle":
          dateExpiration.setMonth(dateExpiration.getMonth() + 1);
          break;
      }

      const result = await db.insert(adhesions).values({
        memberId: input.memberId,
        type: input.type,
        montant: input.montant,
        dateDebut,
        dateExpiration,
        modePayment: input.modePayment || "autre",
        referencePayment: input.referencePayment,
        notes: input.notes,
        status: "pending",
      });

      return result;
    }),

  /**
   * Renouvelle l'adhésion d'un membre
   */
  renewAdhesion: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        type: z.enum(["annuelle", "mensuelle", "trimestrielle", "semestrielle"]),
        montant: z.string(),
        modePayment: z.enum(["virement", "especes", "cheque", "carte", "autre"]).optional(),
        referencePayment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const dateDebut = now;
      const dateExpiration = new Date(now);

      switch (input.type) {
        case "annuelle":
          dateExpiration.setFullYear(dateExpiration.getFullYear() + 1);
          break;
        case "semestrielle":
          dateExpiration.setMonth(dateExpiration.getMonth() + 6);
          break;
        case "trimestrielle":
          dateExpiration.setMonth(dateExpiration.getMonth() + 3);
          break;
        case "mensuelle":
          dateExpiration.setMonth(dateExpiration.getMonth() + 1);
          break;
      }

      const result = await db.insert(adhesions).values({
        memberId: input.memberId,
        type: input.type,
        montant: input.montant,
        dateDebut,
        dateExpiration,
        modePayment: input.modePayment || "autre",
        referencePayment: input.referencePayment,
        status: "pending",
      });

      return result;
    }),

  /**
   * Récupère les adhésions expirées
   */
  getExpiredAdhesions: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allAdhesions = await db.select().from(adhesions);
    const now = new Date();

    return allAdhesions.filter(
      (a) => new Date(a.dateExpiration) <= now && a.status === "active"
    );
  }),

  /**
   * Récupère toutes les adhésions avec les détails des membres
   */
  listWithMembers: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allAdhesions = await db.select().from(adhesions);
    const now = new Date();

    // Enrichir chaque adhésion avec les détails du membre
    const adhesionsWithMembers = await Promise.all(
      allAdhesions.map(async (adhesion) => {
        const memberData = await db
          .select()
          .from(members)
          .where(eq(members.id, adhesion.memberId))
          .limit(1);

        const member = memberData[0];
        const isExpired = new Date(adhesion.dateExpiration) <= now;
        const status = isExpired ? "expired" : adhesion.status;

        return {
          ...adhesion,
          member,
          status,
        };
      })
    );

    return adhesionsWithMembers;
  }),

  /**
   * Récupère les statistiques d'adhésion
   */
  getAdhesionStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalMembers: 0,
        activeAdhesions: 0,
        expiredAdhesions: 0,
        pendingAdhesions: 0,
        totalRevenue: 0,
      };
    }

    const allMembers = await db.select().from(members);
    const allAdhesions = await db.select().from(adhesions);
    const now = new Date();

    const activeAdhesions = allAdhesions.filter((a) => {
      const expirationDate = new Date(a.dateExpiration);
      return expirationDate > now && a.status === "active";
    });
    const expiredAdhesions = allAdhesions.filter((a) => {
      const expirationDate = new Date(a.dateExpiration);
      return expirationDate <= now && a.status === "active";
    });
    const pendingAdhesions = allAdhesions.filter((a) => a.status === "pending");

    const totalRevenue = allAdhesions
      .filter((a) => a.status === "active")
      .reduce((sum, a) => {
        const amount = typeof a.montant === "number" ? a.montant : parseFloat(a.montant.toString());
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    return {
      totalMembers: allMembers.length,
      activeAdhesions: activeAdhesions.length,
      expiredAdhesions: expiredAdhesions.length,
      pendingAdhesions: pendingAdhesions.length,
      totalRevenue,
    };
  }),
});
