import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { permissions, rolePermissions, userRoles, userScopes } from "../drizzle/schema";

export type ScopeType = "national" | "antenne" | "groupe" | "project";
export type AccessLevel = "viewer" | "editor" | "manager";

export type ScopeGrant = {
  scopeType: ScopeType;
  scopeId: number | null;
  accessLevel: AccessLevel;
};

export const DEFAULT_PERMISSIONS = [
  { name: "admin.roles.view", category: "administration", description: "Consulter les rôles et permissions" },
  { name: "admin.roles.manage", category: "administration", description: "Créer et configurer les rôles" },
  { name: "admin.users.manage", category: "administration", description: "Attribuer les rôles aux utilisateurs" },
  { name: "admin.scopes.view", category: "administration", description: "Consulter les périmètres utilisateurs" },
  { name: "admin.scopes.manage", category: "administration", description: "Attribuer les périmètres utilisateurs" },
  { name: "admin.audit.view", category: "administration", description: "Consulter les journaux d’audit" },
  { name: "communication.view", category: "communication", description: "Consulter les annonces et actualités" },
  { name: "communication.manage", category: "communication", description: "Publier et gérer les annonces et actualités" },
  { name: "members.view", category: "members", description: "Consulter les membres" },
  { name: "members.manage", category: "members", description: "Créer et modifier les membres" },
  { name: "crm.view", category: "crm", description: "Consulter les contacts, activités et rapports CRM" },
  { name: "crm.manage", category: "crm", description: "Créer, modifier et supprimer les éléments CRM" },
  { name: "documents.view", category: "documents", description: "Consulter les documents" },
  { name: "documents.manage", category: "documents", description: "Créer et modifier les documents" },
  { name: "signatures.view", category: "documents", description: "Consulter les demandes et preuves de signature" },
  { name: "signatures.manage", category: "documents", description: "Créer, annuler et administrer les demandes de signature" },
  { name: "signatures.sign", category: "documents", description: "Signer les documents assignés au membre" },
  { name: "finances.view", category: "finances", description: "Consulter les finances" },
  { name: "finances.manage", category: "finances", description: "Gérer les opérations financières" },
  { name: "suppliers.view", category: "purchases", description: "Consulter les fournisseurs" },
  { name: "suppliers.manage", category: "purchases", description: "Créer et modifier les fournisseurs" },
  { name: "purchases.view", category: "purchases", description: "Consulter les demandes d’achat et devis" },
  { name: "purchases.manage", category: "purchases", description: "Créer et modifier les demandes d’achat et devis" },
  { name: "purchases.approve", category: "purchases", description: "Approuver ou rejeter les demandes d’achat" },
  { name: "projects.view", category: "projects", description: "Consulter les projets" },
  { name: "projects.manage", category: "projects", description: "Gérer les projets" },
  { name: "structures.view", category: "structures", description: "Consulter les antennes et groupes" },
  { name: "structures.manage", category: "structures", description: "Créer et modifier les antennes et groupes" },
  { name: "governance.view", category: "governance", description: "Consulter les assemblées, résolutions et procès-verbaux" },
  { name: "governance.manage", category: "governance", description: "Créer et administrer les assemblées et résolutions" },
  { name: "governance.vote", category: "governance", description: "Participer aux votes des assemblées autorisées" },
] as const;

const ACCESS_LEVEL_RANK: Record<AccessLevel, number> = {
  viewer: 1,
  editor: 2,
  manager: 3,
};

export function hasRequiredAccess(
  current: AccessLevel,
  required: AccessLevel,
): boolean {
  return ACCESS_LEVEL_RANK[current] >= ACCESS_LEVEL_RANK[required];
}

export function canAccessScope(
  grants: ScopeGrant[],
  scopeType: ScopeType,
  scopeId: number | null,
  requiredAccess: AccessLevel = "viewer",
): boolean {
  return grants.some((grant) => {
    if (!hasRequiredAccess(grant.accessLevel, requiredAccess)) return false;
    if (grant.scopeType === "national") return true;
    return grant.scopeType === scopeType && grant.scopeId === scopeId;
  });
}

export async function ensureDefaultPermissions(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ name: permissions.name }).from(permissions);
  const existingNames = new Set(existing.map((permission) => permission.name));
  const missing = DEFAULT_PERMISSIONS.filter((permission) => !existingNames.has(permission.name));
  if (missing.length > 0) {
    await db.insert(permissions).values(missing.map((permission) => ({
      name: permission.name,
      category: permission.category,
      description: permission.description,
    })));
  }
}

export async function getUserPermissionNames(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({ name: permissions.name })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(userRoles.userId, userId));

  return Array.from(new Set(rows.map((row) => row.name)));
}

export async function userHasPermission(
  userId: number,
  permissionName: string,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const rows = await db
    .select({ id: permissions.id })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(and(eq(userRoles.userId, userId), eq(permissions.name, permissionName)))
    .limit(1);

  return rows.length > 0;
}

export async function getUserScopeGrants(userId: number): Promise<ScopeGrant[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      scopeType: userScopes.scopeType,
      scopeId: userScopes.scopeId,
      accessLevel: userScopes.accessLevel,
    })
    .from(userScopes)
    .where(eq(userScopes.userId, userId));

  return rows as ScopeGrant[];
}

export async function userHasScope(
  userId: number,
  scopeType: ScopeType,
  scopeId: number | null,
  requiredAccess: AccessLevel = "viewer",
): Promise<boolean> {
  const grants = await getUserScopeGrants(userId);
  return canAccessScope(grants, scopeType, scopeId, requiredAccess);
}

export async function assertPermission(
  user: { id: number; role?: string | null },
  permissionName: string,
): Promise<void> {
  if (user.role === "admin") return;
  if (!(await userHasPermission(user.id, permissionName))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Permission requise : ${permissionName}`,
    });
  }
}

export async function assertScope(
  user: { id: number; role?: string | null },
  scopeType: ScopeType,
  scopeId: number | null,
  requiredAccess: AccessLevel = "viewer",
): Promise<void> {
  if (user.role === "admin") return;
  if (!(await userHasScope(user.id, scopeType, scopeId, requiredAccess))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Votre compte n’est pas autorisé sur ce périmètre.",
    });
  }
}

export function permissionProcedure(permissionName: string) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    await assertPermission(ctx.user, permissionName);
    return next();
  });
}

export function scopeProcedure(
  permissionName: string,
  scopeType: ScopeType,
  requiredAccess: AccessLevel = "viewer",
) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    await assertPermission(ctx.user, permissionName);
    const scopeId = (ctx.req as any).scopeId ?? null;
    await assertScope(ctx.user, scopeType, scopeId, requiredAccess);
    return next();
  });
}

export function toScopeGrant(row: {
  scopeType: ScopeType;
  scopeId: number | null;
  accessLevel: AccessLevel;
}): ScopeGrant {
  return {
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    accessLevel: row.accessLevel,
  };
}

export { userScopes };
