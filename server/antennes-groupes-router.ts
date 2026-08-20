/**
 * Routeur tRPC pour la gestion des antennes et groupes.
 * Les listes, mutations et détails sont persistés dans MySQL/TiDB.
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { antennes, groupes } from "../drizzle/schema";
import { eq, like } from "drizzle-orm";
import { assertPermission } from "./authorization";
import { logAudit } from "./audit";

const CreateAntenneSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(255),
  slug: z.string().trim().max(255).optional(),
  description: z.string().trim().optional(),
  city: z.string().trim().min(1, "La ville est requise").max(100),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal("")),
  responsibleId: z.number().int().positive().optional(),
});

const CreateGroupeSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(255),
  slug: z.string().trim().max(255).optional(),
  description: z.string().trim().optional(),
  antenneId: z.number().int().positive().nullable().optional(),
  responsibleId: z.number().int().positive().optional(),
});

const ListSchema = z.object({
  search: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "city"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

const GroupListSchema = ListSchema.extend({
  sortBy: z.enum(["name", "createdAt"]).default("name"),
});

export function generateSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeAntenne(row: typeof antennes.$inferSelect) {
  return { ...row, isActive: row.status === "active" ? 1 : 0 };
}

function normalizeGroupe(row: typeof groupes.$inferSelect) {
  return { ...row, isActive: row.status === "active" ? 1 : 0 };
}

async function ensureUniqueSlug(table: typeof antennes | typeof groupes, requestedSlug: string, currentId?: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
  const existing = await db.select({ id: table.id }).from(table).where(eq(table.slug, requestedSlug)).limit(1);
  if (existing.length > 0 && existing[0].id !== currentId) {
    throw new TRPCError({ code: "CONFLICT", message: "Ce slug est déjà utilisé." });
  }
}

export const antennasRouter = router({
  list: protectedProcedure.input(ListSchema).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const rows = await db.select().from(antennes);
    const search = input.search?.trim().toLowerCase();
    const filtered = search
      ? rows.filter((row) => [row.name, row.city, row.email ?? "", row.slug].some((value) => value.toLowerCase().includes(search)))
      : rows;
    const direction = input.sortOrder === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      const aValue = String(a[input.sortBy] ?? "").toLowerCase();
      const bValue = String(b[input.sortBy] ?? "").toLowerCase();
      return aValue.localeCompare(bValue, "fr", { numeric: true }) * direction;
    });
    const start = (input.page - 1) * input.limit;
    return {
      data: sorted.slice(start, start + input.limit).map(normalizeAntenne),
      pagination: {
        page: input.page,
        limit: input.limit,
        total: sorted.length,
        pages: Math.ceil(sorted.length / input.limit),
      },
    };
  }),

  create: protectedProcedure.input(CreateAntenneSchema).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const slug = input.slug || generateSlug(input.name);
    await ensureUniqueSlug(antennes, slug);
    const result = await db.insert(antennes).values({
      name: input.name,
      slug,
      description: input.description || null,
      city: input.city,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      responsibleId: input.responsibleId ?? null,
      status: "active",
    });
    const created = await db.select().from(antennes).where(eq(antennes.id, Number(result[0].insertId))).limit(1);
    if (!created[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Antenne non créée" });
    await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "antenne", entityId: created[0].id, entityName: created[0].name, description: `Création de l’antenne ${created[0].name}`, status: "success" });
    return normalizeAntenne(created[0]);
  }),

  getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const row = await db.select().from(antennes).where(eq(antennes.id, input.id)).limit(1);
    if (!row[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Antenne introuvable" });
    return normalizeAntenne(row[0]);
  }),

  update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: CreateAntenneSchema.partial().optional(), ...CreateAntenneSchema.partial().shape })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const { id, data, ...flatData } = input;
    const updateData = { ...(data ?? {}), ...flatData };
    if (Object.keys(updateData).length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune modification fournie" });
    if (updateData.slug) await ensureUniqueSlug(antennes, updateData.slug, id);
    const values = Object.fromEntries(Object.entries(updateData).map(([key, value]) => [key, value === "" ? null : value]));
    await db.update(antennes).set(values as any).where(eq(antennes.id, id));
    const updated = await db.select().from(antennes).where(eq(antennes.id, id)).limit(1);
    if (!updated[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Antenne introuvable" });
    await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "antenne", entityId: id, entityName: updated[0].name, description: `Modification de l’antenne ${updated[0].name}`, status: "success" });
    return normalizeAntenne(updated[0]);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const linkedGroups = await db.select({ id: groupes.id }).from(groupes).where(eq(groupes.antenneId, input.id)).limit(1);
    if (linkedGroups.length > 0) throw new TRPCError({ code: "CONFLICT", message: "Supprimez ou déplacez d’abord les groupes rattachés à cette antenne." });
    await db.delete(antennes).where(eq(antennes.id, input.id));
    await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "antenne", entityId: input.id, description: `Suppression de l’antenne ${input.id}`, status: "success" });
    return { success: true } as const;
  }),
});

export const groupesRouter = router({
  list: protectedProcedure.input(GroupListSchema).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const rows = await db.select().from(groupes);
    const search = input.search?.trim().toLowerCase();
    const filtered = search ? rows.filter((row) => [row.name, row.slug, row.description ?? ""].some((value) => value.toLowerCase().includes(search))) : rows;
    const direction = input.sortOrder === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => String(a[input.sortBy] ?? "").localeCompare(String(b[input.sortBy] ?? ""), "fr", { numeric: true }) * direction);
    const start = (input.page - 1) * input.limit;
    return {
      data: sorted.slice(start, start + input.limit).map(normalizeGroupe),
      pagination: { page: input.page, limit: input.limit, total: sorted.length, pages: Math.ceil(sorted.length / input.limit) },
    };
  }),

  listByAntenne: protectedProcedure.input(z.object({ antenneId: z.number().int().positive() })).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const rows = await db.select().from(groupes).where(eq(groupes.antenneId, input.antenneId));
    return rows.map(normalizeGroupe);
  }),

  create: protectedProcedure.input(CreateGroupeSchema).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    if (input.antenneId != null) {
      const parent = await db.select({ id: antennes.id }).from(antennes).where(eq(antennes.id, input.antenneId)).limit(1);
      if (!parent[0]) throw new TRPCError({ code: "BAD_REQUEST", message: "Antenne introuvable" });
    }
    const slug = input.slug || generateSlug(input.name);
    await ensureUniqueSlug(groupes, slug);
    const result = await db.insert(groupes).values({
      name: input.name,
      slug,
      description: input.description || null,
      antenneId: input.antenneId ?? null,
      responsibleId: input.responsibleId ?? null,
      status: "active",
    });
    const created = await db.select().from(groupes).where(eq(groupes.id, Number(result[0].insertId))).limit(1);
    if (!created[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Groupe non créé" });
    await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "groupe", entityId: created[0].id, entityName: created[0].name, description: `Création du groupe ${created[0].name}`, status: "success" });
    return normalizeGroupe(created[0]);
  }),

  getById: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.view");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const row = await db.select().from(groupes).where(eq(groupes.id, input.id)).limit(1);
    if (!row[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Groupe introuvable" });
    return normalizeGroupe(row[0]);
  }),

  update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: CreateGroupeSchema.partial().optional(), ...CreateGroupeSchema.partial().shape })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    const { id, data, ...flatData } = input;
    const updateData = { ...(data ?? {}), ...flatData };
    if (Object.keys(updateData).length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucune modification fournie" });
    if (updateData.slug) await ensureUniqueSlug(groupes, updateData.slug, id);
    const values = Object.fromEntries(Object.entries(updateData).map(([key, value]) => [key, value === "" ? null : value]));
    await db.update(groupes).set(values as any).where(eq(groupes.id, id));
    const updated = await db.select().from(groupes).where(eq(groupes.id, id)).limit(1);
    if (!updated[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Groupe introuvable" });
    await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "groupe", entityId: id, entityName: updated[0].name, description: `Modification du groupe ${updated[0].name}`, status: "success" });
    return normalizeGroupe(updated[0]);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "structures.manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
    await db.delete(groupes).where(eq(groupes.id, input.id));
    await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "groupe", entityId: input.id, description: `Suppression du groupe ${input.id}`, status: "success" });
    return { success: true } as const;
  }),
});
