/**
 * Routeur tRPC pour la gestion des Antennes et Groupes
 * Version simplifiée avec requêtes SQL directes
 */

import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";

// ============================================================================
// SCHÉMAS DE VALIDATION
// ============================================================================

const CreateAntenneSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  slug: z.string().min(1, "Le slug est requis").max(100),
  description: z.string().optional(),
  city: z.string().min(1, "La ville est requise").max(100),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  responsibleId: z.number().optional(),
});

const UpdateAntenneSchema = CreateAntenneSchema.partial();

const CreateGroupeSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  slug: z.string().min(1, "Le slug est requis").max(100),
  description: z.string().optional(),
  antenneId: z.number().min(1, "L'antenne est requise"),
  responsibleId: z.number().optional(),
});

const UpdateGroupeSchema = CreateGroupeSchema.partial();

const ListSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "city"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// ============================================================================
// PROCÉDURES ANTENNES
// ============================================================================

export const antennasRouter = router({
  // Lister les antennes avec filtrage et tri
  list: publicProcedure
    .input(ListSchema)
    .query(async ({ input }) => {
      try {
        const db = getDb();
        const { search = "", sortBy = "name", sortOrder = "asc", page = 1, limit = 10 } = input;

        // Construire la requête WHERE
        let whereClause = "1=1";
        const params: any[] = [];

        if (search) {
          whereClause += " AND (name LIKE ? OR city LIKE ? OR email LIKE ?)";
          params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Construire l'ORDER BY
        let orderClause = "name ASC";
        if (sortBy === "city") {
          orderClause = `city ${sortOrder === "asc" ? "ASC" : "DESC"}`;
        } else if (sortBy === "createdAt") {
          orderClause = `createdAt ${sortOrder === "asc" ? "ASC" : "DESC"}`;
        } else {
          orderClause = `name ${sortOrder === "asc" ? "ASC" : "DESC"}`;
        }

        // Récupérer le total
        const countResult = await db.query(`SELECT COUNT(*) as count FROM antennes WHERE ${whereClause}`, params);
        const totalCount = countResult[0]?.count || 0;

        // Récupérer les données avec pagination
        const offset = (page - 1) * limit;
        const antennes = await db.query(
          `SELECT * FROM antennes WHERE ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        return {
          data: antennes,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Erreur lors de la récupération des antennes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des antennes",
        });
      }
    }),

  // Créer une antenne
  create: protectedProcedure
    .input(CreateAntenneSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();

        // Vérifier que le slug est unique
        const existing = await db.query("SELECT id FROM antennes WHERE slug = ?", [input.slug]);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un antenne avec ce slug existe déjà",
          });
        }

        const result = await db.query(
          `INSERT INTO antennes (name, slug, description, city, address, phone, email, responsibleId, isActive, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            input.name,
            input.slug,
            input.description || null,
            input.city,
            input.address || null,
            input.phone || null,
            input.email || null,
            input.responsibleId || null,
            1,
          ]
        );

        const antenne = await db.query("SELECT * FROM antennes WHERE id = ?", [result.insertId]);
        return antenne[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Erreur lors de la création de l'antenne:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création de l'antenne",
        });
      }
    }),

  // Récupérer une antenne
  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      try {
        const db = getDb();
        const antenne = await db.query("SELECT * FROM antennes WHERE id = ?", [input]);

        if (!antenne || antenne.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Antenne non trouvée",
          });
        }

        return antenne[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération de l'antenne",
        });
      }
    }),

  // Mettre à jour une antenne
  update: protectedProcedure
    .input(z.object({ id: z.number(), data: UpdateAntenneSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();
        const { id, data } = input;

        // Vérifier que l'antenne existe
        const existing = await db.query("SELECT * FROM antennes WHERE id = ?", [id]);

        if (!existing || existing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Antenne non trouvée",
          });
        }

        // Vérifier l'unicité du slug si modifié
        if (data.slug && data.slug !== existing[0].slug) {
          const slugExists = await db.query("SELECT id FROM antennes WHERE slug = ?", [data.slug]);
          if (slugExists.length > 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Un antenne avec ce slug existe déjà",
            });
          }
        }

        // Construire la requête UPDATE
        const updates: string[] = [];
        const values: any[] = [];

        Object.entries(data).forEach(([key, value]) => {
          updates.push(`${key} = ?`);
          values.push(value);
        });

        updates.push("updatedAt = NOW()");
        values.push(id);

        await db.query(`UPDATE antennes SET ${updates.join(", ")} WHERE id = ?`, values);

        const updated = await db.query("SELECT * FROM antennes WHERE id = ?", [id]);
        return updated[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Erreur lors de la mise à jour de l'antenne:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour de l'antenne",
        });
      }
    }),

  // Supprimer une antenne
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();

        // Vérifier que l'antenne existe
        const antenne = await db.query("SELECT * FROM antennes WHERE id = ?", [input]);

        if (!antenne || antenne.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Antenne non trouvée",
          });
        }

        // Vérifier qu'il n'y a pas de groupes associés
        const groupes = await db.query("SELECT id FROM groupes WHERE antenneId = ?", [input]);

        if (groupes.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Impossible de supprimer une antenne avec des groupes associés",
          });
        }

        await db.query("DELETE FROM antennes WHERE id = ?", [input]);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Erreur lors de la suppression de l'antenne:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression de l'antenne",
        });
      }
    }),
});

// ============================================================================
// PROCÉDURES GROUPES
// ============================================================================

export const groupesRouter = router({
  // Lister les groupes avec filtrage et tri
  list: publicProcedure
    .input(ListSchema)
    .query(async ({ input }) => {
      try {
        const db = getDb();
        const { search = "", sortBy = "name", sortOrder = "asc", page = 1, limit = 10 } = input;

        let whereClause = "1=1";
        const params: any[] = [];

        if (search) {
          whereClause += " AND (name LIKE ? OR description LIKE ?)";
          params.push(`%${search}%`, `%${search}%`);
        }

        let orderClause = "name ASC";
        if (sortBy === "createdAt") {
          orderClause = `createdAt ${sortOrder === "asc" ? "ASC" : "DESC"}`;
        } else {
          orderClause = `name ${sortOrder === "asc" ? "ASC" : "DESC"}`;
        }

        const countResult = await db.query(`SELECT COUNT(*) as count FROM groupes WHERE ${whereClause}`, params);
        const totalCount = countResult[0]?.count || 0;

        const offset = (page - 1) * limit;
        const groupes = await db.query(
          `SELECT * FROM groupes WHERE ${whereClause} ORDER BY ${orderClause} LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        );

        return {
          data: groupes,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Erreur lors de la récupération des groupes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des groupes",
        });
      }
    }),

  // Lister les groupes par antenne
  listByAntenne: publicProcedure
    .input(z.number())
    .query(async ({ input: antenneId }) => {
      try {
        const db = getDb();
        const groupes = await db.query("SELECT * FROM groupes WHERE antenneId = ? ORDER BY name ASC", [antenneId]);
        return groupes;
      } catch (error) {
        console.error("Erreur lors de la récupération des groupes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération des groupes",
        });
      }
    }),

  // Créer un groupe
  create: protectedProcedure
    .input(CreateGroupeSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();

        // Vérifier que l'antenne existe
        const antenne = await db.query("SELECT id FROM antennes WHERE id = ?", [input.antenneId]);

        if (!antenne || antenne.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Antenne non trouvée",
          });
        }

        // Vérifier l'unicité du slug
        const existing = await db.query("SELECT id FROM groupes WHERE slug = ?", [input.slug]);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Un groupe avec ce slug existe déjà",
          });
        }

        const result = await db.query(
          `INSERT INTO groupes (name, slug, description, antenneId, responsibleId, isActive, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            input.name,
            input.slug,
            input.description || null,
            input.antenneId,
            input.responsibleId || null,
            1,
          ]
        );

        const groupe = await db.query("SELECT * FROM groupes WHERE id = ?", [result.insertId]);
        return groupe[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Erreur lors de la création du groupe:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la création du groupe",
        });
      }
    }),

  // Récupérer un groupe
  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      try {
        const db = getDb();
        const groupe = await db.query("SELECT * FROM groupes WHERE id = ?", [input]);

        if (!groupe || groupe.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Groupe non trouvé",
          });
        }

        return groupe[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la récupération du groupe",
        });
      }
    }),

  // Mettre à jour un groupe
  update: protectedProcedure
    .input(z.object({ id: z.number(), data: UpdateGroupeSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();
        const { id, data } = input;

        // Vérifier que le groupe existe
        const existing = await db.query("SELECT * FROM groupes WHERE id = ?", [id]);

        if (!existing || existing.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Groupe non trouvé",
          });
        }

        // Vérifier l'unicité du slug si modifié
        if (data.slug && data.slug !== existing[0].slug) {
          const slugExists = await db.query("SELECT id FROM groupes WHERE slug = ?", [data.slug]);
          if (slugExists.length > 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Un groupe avec ce slug existe déjà",
            });
          }
        }

        // Construire la requête UPDATE
        const updates: string[] = [];
        const values: any[] = [];

        Object.entries(data).forEach(([key, value]) => {
          updates.push(`${key} = ?`);
          values.push(value);
        });

        updates.push("updatedAt = NOW()");
        values.push(id);

        await db.query(`UPDATE groupes SET ${updates.join(", ")} WHERE id = ?`, values);

        const updated = await db.query("SELECT * FROM groupes WHERE id = ?", [id]);
        return updated[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Erreur lors de la mise à jour du groupe:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la mise à jour du groupe",
        });
      }
    }),

  // Supprimer un groupe
  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      try {
        const db = getDb();

        // Vérifier que le groupe existe
        const groupe = await db.query("SELECT * FROM groupes WHERE id = ?", [input]);

        if (!groupe || groupe.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Groupe non trouvé",
          });
        }

        await db.query("DELETE FROM groupes WHERE id = ?", [input]);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Erreur lors de la suppression du groupe:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la suppression du groupe",
        });
      }
    }),
});
