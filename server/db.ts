import { eq, and, like, desc, asc, sql, or, inArray, lt, lte, gte, ne, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createHash } from "node:crypto";
import { 
  users,
  categories,
  documents,
  documentSavedViews,
  documentNotes,
  members,
  memberCertificates,
  adhesions,
  documentPermissions,
  signatureRequests,
  signatureSigners,
  activityLogs,
  cotisations,
  dons,
  depenses,
  transactions,
  emailTemplates,
  emailHistory,
  emailRecipients,
  appSettings,
  crmContacts,
  crmActivities,
  adhesionPipeline,
  crmReports,
  crmEmailIntegration,
  globalSettings,
  passwordResetRequests,
  dataDeletionRequests,
  projects,
  projectMembers,
  projectTasks,
  projectMilestones,
  projectUpdates,
  projectTaskComments,
  projectBudgetItems,
  projectImpactIndicators,
  auditLogs,
  roles,
  rolePermissions,
  userRoles,
  userScopes,
  permissions,
  antennes,
  groupes,
  groupeMembers,
  campaigns,
  events,
  announcements,
  news,
  newsComments,
  documentVersions,
 	membershipFeeRules,
	memberEvaluations,
	memberGrades,
	stripePayments,
		stripeEvents,
		suppliers,
		purchaseRequests,
		purchaseQuotes
	} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

const schema = {
  users,
  categories,
  documents,
  documentVersions,
  documentNotes,
  members,
  adhesions,
  documentPermissions,
  signatureRequests,
  signatureSigners,
  activityLogs,
  cotisations,
  dons,
  depenses,
  transactions,
  emailTemplates,
  emailHistory,
  emailRecipients,
  appSettings,
  crmContacts,
  crmActivities,
  adhesionPipeline,
  crmReports,
  crmEmailIntegration,
  globalSettings,
  passwordResetRequests,
  dataDeletionRequests,
  projects,
	permissions,
	stripePayments,
	stripeEvents,

  rolePermissions,
  userRoles,
  userScopes,
  antennes,
  groupes,
  groupeMembers,
  projectMembers,
  projectTasks,
  projectMilestones,
  projectUpdates,
  projectTaskComments,
  projectBudgetItems,
  projectImpactIndicators,
  membershipFeeRules,
  memberEvaluations,
  memberGrades,
  suppliers,
  purchaseRequests,
  purchaseQuotes,
};

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: 'default' }) as any;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date().toISOString();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date().toISOString();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CATEGORY FUNCTIONS ============
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return { id: result[0].insertId, ...data };
}

export async function seedDefaultCategories() {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(categories).limit(1);
  if (existing.length > 0) return;

  const defaultCategories: InsertCategory[] = [
    { name: "Documents Juridiques", slug: "juridique", description: "Statuts, règlements, autorisations", color: "#e76f51", icon: "scale", sortOrder: 1 },
    { name: "Gouvernance et Pilotage", slug: "gouvernance", description: "Feuille de route, organigramme, PV", color: "#2d7a4f", icon: "users", sortOrder: 2 },
    { name: "Documents Opérationnels", slug: "operationnel", description: "Projets, rapports, planning", color: "#f4a261", icon: "clipboard", sortOrder: 3 },
    { name: "Documents Financiers", slug: "financier", description: "Budget, comptabilité, audits", color: "#264653", icon: "wallet", sortOrder: 4 },
    { name: "Ressources Humaines", slug: "rh", description: "Membres, bénévoles, contrats", color: "#9c89b8", icon: "user-check", sortOrder: 5 },
    { name: "Communication", slug: "communication", description: "Logo, brochures, réseaux sociaux", color: "#00b4d8", icon: "megaphone", sortOrder: 6 },
    { name: "Financement", slug: "financement", description: "Demandes, partenariats, subventions", color: "#e9c46a", icon: "hand-coins", sortOrder: 7 },
  ];

  await db.insert(categories).values(defaultCategories);
}

// ============ DOCUMENT FUNCTIONS ============
export async function getAllDocuments(filters?: {
  categoryId?: number;
  status?: string;
  priority?: string;
  search?: string;
  isArchived?: number;
  retentionFilter?: "legal-hold" | "active";
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(documents);
  const conditions = [];

  if (filters?.categoryId) {
    conditions.push(eq(documents.categoryId, filters.categoryId));
  }
  if (filters?.status) {
    conditions.push(eq(documents.status, filters.status as "pending" | "in-progress" | "completed"));
  }
  if (filters?.priority) {
    conditions.push(eq(documents.priority, filters.priority as "low" | "medium" | "high" | "urgent"));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(documents.title, `%${filters.search}%`),
        like(documents.description, `%${filters.search}%`),
        like(documents.contentIndex, `%${filters.search}%`)
      )
    );
  }
  if (filters?.retentionFilter === "legal-hold") {
    conditions.push(eq(documents.legalHold, true));
  } else if (filters?.retentionFilter === "active") {
    conditions.push(or(eq(documents.legalHold, true), gte(documents.retentionUntil, Date.now())));
  }
  if (filters?.isArchived !== undefined) {
    conditions.push(eq(documents.isArchived, filters.isArchived ? 1 : 0));
  } else {
    conditions.push(eq(documents.isArchived, 0));
  }

  if (conditions.length > 0) {
    return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.updatedAt));
  }
  
  return db.select().from(documents).where(eq(documents.isArchived, 0)).orderBy(desc(documents.updatedAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

export async function getDocumentSavedViews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentSavedViews).where(eq(documentSavedViews.userId, userId)).orderBy(desc(documentSavedViews.updatedAt));
}

export async function createDocumentSavedView(data: typeof documentSavedViews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentSavedViews).values(data);
  return db.select().from(documentSavedViews).where(eq(documentSavedViews.id, Number(result[0].insertId))).limit(1).then((rows) => rows[0]);
}

export async function deleteDocumentSavedView(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentSavedViews).where(and(eq(documentSavedViews.id, id), eq(documentSavedViews.userId, userId)));
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateDocument(id: number, data: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(documents).set(data).where(eq(documents.id, id));
  return getDocumentById(id);
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documents).where(eq(documents.id, id));
}

export async function getDocumentPermissionForUser(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const owned = await db.select({ id: documents.id }).from(documents).where(and(eq(documents.id, documentId), eq(documents.createdBy, userId))).limit(1);
  if (owned.length > 0) return { id: 0, documentId, memberId: 0, canView: 1, canEdit: 1, canDelete: 1, createdAt: new Date().toISOString() };
  const rows = await db.select({ permission: documentPermissions }).from(documentPermissions).innerJoin(members, eq(members.id, documentPermissions.memberId)).where(and(eq(documentPermissions.documentId, documentId), eq(members.userId, userId), eq(members.status, "active"))).limit(1);
  return rows[0]?.permission;
}

export async function getAccessibleDocumentIds(userId: number, capability: "canView" | "canEdit" | "canDelete" = "canView") {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ documentId: documentPermissions.documentId }).from(documentPermissions).innerJoin(members, eq(members.id, documentPermissions.memberId)).where(and(eq(members.userId, userId), eq(members.status, "active"), eq(documentPermissions[capability], 1)));
  const owned = await db.select({ documentId: documents.id }).from(documents).where(eq(documents.createdBy, userId));
  return Array.from(new Set([...rows.map((row) => row.documentId), ...owned.map((row) => row.documentId)]));
}

export async function getDocumentPermissions(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentPermissions).where(eq(documentPermissions.documentId, documentId)).orderBy(asc(documentPermissions.memberId));
}

export async function setDocumentPermission(data: typeof documentPermissions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentPermissions).where(and(eq(documentPermissions.documentId, data.documentId), eq(documentPermissions.memberId, data.memberId)));
  const result = await db.insert(documentPermissions).values(data);
  return { id: result[0].insertId, ...data };
}

export async function removeDocumentPermission(documentId: number, memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentPermissions).where(and(eq(documentPermissions.documentId, documentId), eq(documentPermissions.memberId, memberId)));
}

export async function getDocumentVersions(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentVersions).where(eq(documentVersions.documentId, documentId)).orderBy(desc(documentVersions.versionNumber));
}

export async function createDocumentVersion(data: typeof documentVersions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentVersions).values(data);
  return { id: result[0].insertId, ...data };
}

export async function getDocumentStats() {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, inProgress: 0, pending: 0, urgent: 0 };

  const allDocs = await db.select().from(documents).where(eq(documents.isArchived, 0));
  
  return {
    total: allDocs.length,
    completed: allDocs.filter(d => d.status === "completed").length,
    inProgress: allDocs.filter(d => d.status === "in-progress").length,
    pending: allDocs.filter(d => d.status === "pending").length,
    urgent: allDocs.filter(d => d.priority === "urgent").length,
  };
}

export async function seedDefaultDocuments() {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(documents).limit(1);
  if (existing.length > 0) return;

  const cats = await getAllCategories();
  if (cats.length === 0) return;

  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));

  const defaultDocs: InsertDocument[] = [
    // Juridique
    { title: "Statuts de l'association", description: "Version validée et conforme", categoryId: catMap["juridique"], priority: "urgent", status: "pending" },
    { title: "Règlement intérieur", description: "Règles de fonctionnement interne", categoryId: catMap["juridique"], priority: "urgent", status: "pending" },
    { title: "Autorisation de fonctionner", description: "Ministère de l'Intérieur", categoryId: catMap["juridique"], priority: "urgent", status: "pending" },
    { title: "PV de l'AG constitutive", description: "Procès-verbal de création", categoryId: catMap["juridique"], priority: "high", status: "pending" },
    { title: "Liste du Bureau Exécutif", description: "Noms, fonctions et contacts", categoryId: catMap["juridique"], priority: "high", status: "pending" },
    // Gouvernance
    { title: "Feuille de route stratégique", description: "Vision 1-3 ans", categoryId: catMap["gouvernance"], priority: "urgent", status: "pending" },
    { title: "Plan d'actions annuel", description: "Actions de l'année", categoryId: catMap["gouvernance"], priority: "urgent", status: "pending" },
    { title: "Organigramme", description: "Structure organisationnelle", categoryId: catMap["gouvernance"], priority: "urgent", status: "pending" },
    { title: "Fiches de fonctions", description: "Rôles et responsabilités", categoryId: catMap["gouvernance"], priority: "high", status: "pending" },
    // Opérationnel
    { title: "Note institutionnelle", description: "Présentation 2-3 pages", categoryId: catMap["operationnel"], priority: "urgent", status: "pending" },
    { title: "Portfolio des projets", description: "Projets réalisés", categoryId: catMap["operationnel"], priority: "urgent", status: "pending" },
    { title: "Fiches projets", description: "Contexte et objectifs", categoryId: catMap["operationnel"], priority: "urgent", status: "pending" },
    // Financier
    { title: "Budget annuel", description: "Budget de fonctionnement", categoryId: catMap["financier"], priority: "urgent", status: "pending" },
    { title: "Plan de financement", description: "Sources de revenus", categoryId: catMap["financier"], priority: "high", status: "pending" },
    { title: "Livre de caisse", description: "Suivi des entrées/sorties", categoryId: catMap["financier"], priority: "high", status: "pending" },
    // RH
    { title: "Registre des membres", description: "Liste complète des membres", categoryId: catMap["rh"], priority: "high", status: "pending" },
    { title: "Fiches d'adhésion", description: "Formulaires d'inscription", categoryId: catMap["rh"], priority: "medium", status: "pending" },
    // Communication
    { title: "Logo officiel", description: "Identité visuelle", categoryId: catMap["communication"], priority: "high", status: "pending" },
    { title: "Brochure de présentation", description: "Document de communication", categoryId: catMap["communication"], priority: "medium", status: "pending" },
    // Financement
    { title: "Dossier de demande de financement", description: "Template pour bailleurs", categoryId: catMap["financement"], priority: "urgent", status: "pending" },
    { title: "Lettre de demande de partenariat", description: "Modèle de lettre", categoryId: catMap["financement"], priority: "high", status: "pending" },
  ];

  await db.insert(documents).values(defaultDocs);
}

// ============ NOTES FUNCTIONS ============
export async function getNotesByDocumentId(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ note: documentNotes, author: users }).from(documentNotes).leftJoin(users, eq(users.id, documentNotes.userId)).where(eq(documentNotes.documentId, documentId)).orderBy(desc(documentNotes.createdAt));
  return rows.map(({ note, author }) => ({ ...note, authorName: author?.name ?? "Utilisateur", authorRole: author?.role ?? "user" }));
}

export async function getNoteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documentNotes).where(eq(documentNotes.id, id)).limit(1);
  return result[0];
}

export async function createNote(data: InsertDocumentNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documentNotes).values(data);
  return { id: result[0].insertId, ...data };
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(documentNotes).where(eq(documentNotes.id, id));
}

// ============ MEMBERS FUNCTIONS ============
export async function getAllMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(members).orderBy(asc(members.lastName));
}

export async function getAllMembersWithGrades() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(members)
    .leftJoin(memberGrades, eq(memberGrades.memberId, members.id))
    .orderBy(asc(members.lastName));
  return rows.map(({ members: member, member_grades: grade }) => ({
    ...member,
    grade: grade?.currentGrade ?? null,
  }));
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function getNextOrderNumberForMember(gender: string, joinedAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const month = String(joinedAt.getMonth() + 1).padStart(2, "0");
  const year = String(joinedAt.getFullYear()).slice(-2);
  
  // Count existing members with the same gender, month, and year
  const existingMembers = await db
    .select({ count: count() })
    .from(members)
    .where(
      and(
        eq(members.gender, gender as any),
        sql`MONTH(${members.joinedAt}) = ${parseInt(month)}`,
        sql`YEAR(${members.joinedAt}) = ${parseInt("20" + year)}`
      )
    );
  
  return (existingMembers[0]?.count || 0) + 1;
}

export async function createMember(data: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate memberId if not provided; accept legacy memberID input for backward compatibility.
  const legacyMemberId = (data as InsertMember & { memberID?: string }).memberID;
  let memberId = data.memberId || legacyMemberId;
  if (!memberId) {
    const { generateMemberId } = await import("../shared/memberIdGenerator");
    const genderCode = data.gender || "3";
    const genderMap: Record<string, "male" | "female" | "other"> = { "1": "male", "2": "female", "3": "other" };
    const gender = genderMap[genderCode] || "other";
    const joinedAt = data.joinedAt || new Date().toISOString();
    const joinedAtDate = typeof joinedAt === "string" ? new Date(joinedAt) : joinedAt;
    const orderNumber = await getNextOrderNumberForMember(genderCode, joinedAtDate);
    memberId = generateMemberId(gender, joinedAtDate, orderNumber);
  }

  const { memberID: _legacyMemberID, ...memberData } = data as InsertMember & { memberID?: string };
  const normalizedData = {
    ...memberData,
    joinedAt: memberData.joinedAt,
    memberId,
  };
  const result = await db.insert(members).values(normalizedData);
  return { id: result[0].insertId, ...data, memberId, memberID: memberId };
}

export async function updateMember(id: number, data: Partial<InsertMember>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(members).set(data).where(eq(members.id, id));
  return getMemberById(id);
}

export async function deleteMember(id: number) {
	  const db = await getDb();
	  if (!db) throw new Error("Database not available");
	  await db.delete(members).where(eq(members.id, id));
	}

	export async function createMemberCertificate(data: { memberId: number; certificateType: 'membership_card' | 'tax_receipt' | 'attestation'; referenceNumber: string; pdfUrl?: string }) {
	  const db = await getDb();
	  if (!db) throw new Error("Database not available");
	  const result = await db.insert(memberCertificates).values(data);
	  return { id: result[0].insertId, ...data };
	}

	export async function getMemberCertificates(memberId: number) {
	  const db = await getDb();
	  if (!db) return [];
	  return db.select().from(memberCertificates).where(eq(memberCertificates.memberId, memberId)).orderBy(desc(memberCertificates.createdAt));
	}

// ============ ACTIVITY LOG FUNCTIONS ============
export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(data);
}

export async function getRecentActivity(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}


// ============ COTISATIONS ============

export async function createCotisation(data: InsertCotisation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(cotisations).values(data);
  return result;
}

export async function getCotisations() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cotisations);
}

export async function getCotisationsByMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(cotisations).where(eq(cotisations.memberId, memberId));
}

export async function updateCotisation(id: number, data: Partial<InsertCotisation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(cotisations).set(data).where(eq(cotisations.id, id));
}

export async function getMembershipFeeRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(membershipFeeRules).orderBy(asc(membershipFeeRules.category), asc(membershipFeeRules.currency), desc(membershipFeeRules.validFrom));
}

export async function getActiveMembershipFeeRule(category: string, currency: "EUR" | "XOF") {
  const db = await getDb();
  if (!db) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db.select().from(membershipFeeRules)
    .where(and(eq(membershipFeeRules.category, category as typeof membershipFeeRules.category.enumValues[number]), eq(membershipFeeRules.currency, currency), eq(membershipFeeRules.isActive, 1), lte(membershipFeeRules.validFrom, today)))
    .orderBy(desc(membershipFeeRules.validFrom))
    .limit(1);
  return rows[0];
}

export async function createMembershipFeeRule(data: InsertMembershipFeeRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(membershipFeeRules).values(data);
  return { id: Number(result[0].insertId), ...data };
}

// ============ DONS ============

export async function createDon(data: InsertDon) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(dons).values(data);
}

export async function getDons() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(dons);
}

// ============ DÉPENSES ============

export async function createDepense(data: InsertDepense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(depenses).values(data);
}

export async function getDepenses() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(depenses);
}

// ============ TRANSACTIONS ============

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(transactions).values(data);
}

export async function getTransactions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(transactions);
}

// ============ STATISTIQUES FINANCIÈRES ============

const EUR_TO_XOF_REFERENCE = 655.957;
const toEurReference = (amount: string | number, currency: "EUR" | "XOF" | "CFA" = "EUR") => {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount || "0");
  return currency === "EUR" ? value : value / EUR_TO_XOF_REFERENCE;
};

const addByCurrency = (bucket: { EUR: number; XOF: number }, amount: string | number, currency: "EUR" | "XOF" | "CFA" = "EUR") => {
  const normalized = currency === "EUR" ? "EUR" : "XOF";
  bucket[normalized] += typeof amount === "number" ? amount : Number.parseFloat(amount || "0");
};

export async function getFinancialStats() {
  const db = await getDb();
  if (!db) return null;
  
  const allCotisations = await db.select().from(cotisations);
  const allDons = await db.select().from(dons);
  const allDepenses = await db.select().from(depenses);
  const cotisationsByCurrency = { EUR: 0, XOF: 0 };
  const donsByCurrency = { EUR: 0, XOF: 0 };
  const depensesByCurrency = { EUR: 0, XOF: 0 };
  
  allCotisations.forEach((item) => addByCurrency(cotisationsByCurrency, item.montant, item.currency));
  allDons.forEach((item) => addByCurrency(donsByCurrency, item.montant, item.currency));
  allDepenses.forEach((item) => addByCurrency(depensesByCurrency, item.montant, item.currency));
  const totalCotisations = allCotisations.reduce((sum, c) => sum + toEurReference(c.montant, c.currency), 0);
  const totalDons = allDons.reduce((sum, d) => sum + toEurReference(d.montant, d.currency), 0);
  const totalDepenses = allDepenses.reduce((sum, d) => sum + toEurReference(d.montant, d.currency), 0);
  
  const cotisationsPayees = allCotisations.filter(c => c.statut === "payée").length;
  const cotisationsEnAttente = allCotisations.filter(c => c.statut === "en attente").length;
  const cotisationsEnRetard = allCotisations.filter(c => c.statut === "en retard").length;
  
  return {
    totalCotisations,
    totalDons,
    totalDepenses,
    solde: totalCotisations + totalDons - totalDepenses,
    currency: "EUR" as const,
    byCurrency: { cotisations: cotisationsByCurrency, dons: donsByCurrency, depenses: depensesByCurrency },
    cotisationsPayees,
    cotisationsEnAttente,
    cotisationsEnRetard,
    nombreDons: allDons.length,
    nombreDepenses: allDepenses.length,
  };
}

// ============ EMAIL TEMPLATES ============

export async function getEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
}

export async function getEmailTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  return result[0];
}

export async function createEmailTemplate(data: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailTemplates).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateEmailTemplate(id: number, data: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, id));
  return getEmailTemplateById(id);
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

// ============ ELECTRONIC SIGNATURES ============

export function buildDocumentIntegrityHash(document: { id: number; title: string; fileKey?: string | null; updatedAt?: string | null }) {
  return createHash("sha256").update(JSON.stringify({ id: document.id, title: document.title, fileKey: document.fileKey ?? null, updatedAt: document.updatedAt ?? null })).digest("hex");
}

export async function createSignatureRequest(data: { documentId: number; createdBy: number; subject: string; documentHash: string; expiresAt?: string | null; signer: { memberId: number; signerName: string; signerEmail: string } }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select({ id: signatureRequests.id }).from(signatureRequests).where(and(eq(signatureRequests.documentId, data.documentId), eq(signatureRequests.status, "pending"))).limit(1);
  if (existing.length > 0) throw new Error("Une demande de signature active existe déjà pour ce document");
  const requestResult = await db.insert(signatureRequests).values({ documentId: data.documentId, createdBy: data.createdBy, subject: data.subject, documentHash: data.documentHash, expiresAt: data.expiresAt ?? null });
  const requestId = Number(requestResult[0].insertId);
  await db.insert(signatureSigners).values({ requestId, memberId: data.signer.memberId, signerName: data.signer.signerName, signerEmail: data.signer.signerEmail });
  return getSignatureRequestById(requestId);
}

export async function getSignatureRequestsForDocument(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  const requests = await db.select().from(signatureRequests).where(eq(signatureRequests.documentId, documentId)).orderBy(desc(signatureRequests.createdAt));
  return Promise.all(requests.map(async (request) => ({ ...request, signers: await db.select().from(signatureSigners).where(eq(signatureSigners.requestId, request.id)).orderBy(asc(signatureSigners.orderIndex)) })));
}

export async function getSignatureRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const request = await db.select().from(signatureRequests).where(eq(signatureRequests.id, id)).limit(1);
  if (!request[0]) return undefined;
  const signers = await db.select().from(signatureSigners).where(eq(signatureSigners.requestId, id)).orderBy(asc(signatureSigners.orderIndex));
  return { ...request[0], signers };
}

export async function getPendingSignatureForMember(memberId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(signatureSigners).where(and(eq(signatureSigners.memberId, memberId), eq(signatureSigners.status, "pending"))).orderBy(desc(signatureSigners.createdAt));
}

export async function signSignatureRequest(input: { requestId: number; signerId: number; typedSignature: string; signedAt: string; evidenceHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(signatureSigners).set({ status: "signed", typedSignature: input.typedSignature, signedAt: input.signedAt, consentAt: input.signedAt, evidenceHash: input.evidenceHash }).where(and(eq(signatureSigners.id, input.signerId), eq(signatureSigners.requestId, input.requestId), eq(signatureSigners.status, "pending")));
  const remaining = await db.select({ id: signatureSigners.id }).from(signatureSigners).where(and(eq(signatureSigners.requestId, input.requestId), eq(signatureSigners.status, "pending"))).limit(1);
  await db.update(signatureRequests).set({ status: remaining.length === 0 ? "completed" : "partially-signed", completedAt: remaining.length === 0 ? input.signedAt : null }).where(eq(signatureRequests.id, input.requestId));
  return getSignatureRequestById(input.requestId);
}

export async function getSignatureExportData(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const request = await getSignatureRequestById(id);
  if (!request || request.status !== "completed") return undefined;
  const document = await getDocumentById(request.documentId);
  if (!document) return undefined;
  const audit = await db.select({ action: auditLogs.action, description: auditLogs.description, status: auditLogs.status, createdAt: auditLogs.createdAt, entityId: auditLogs.entityId }).from(auditLogs).where(and(eq(auditLogs.entityType, "signature_request"), eq(auditLogs.entityId, id))).orderBy(desc(auditLogs.createdAt));
  return { request, document: { id: document.id, title: document.title, description: document.description, fileName: document.fileName, fileType: document.fileType, fileSize: document.fileSize, fileUrl: document.fileUrl }, audit };
}

export function resolveSignatureDeliveryStatus(eventAction: string | undefined, requestStatus: string) {
  if (eventAction === "EMAIL_SENT") return "sent" as const;
  if (eventAction === "EMAIL_FAILED") return "failed" as const;
  if (eventAction === "EMAIL_SKIPPED") return "skipped" as const;
  return requestStatus === "completed" ? "pending" as const : "not-ready" as const;
}

export async function getSignatureDeliveryDashboard(limit = 20) {
  const db = await getDb();
  if (!db) return { summary: { sent: 0, failed: 0, skipped: 0, pending: 0, notReady: 0 }, requests: [] };
  const requests = await db.select().from(signatureRequests).orderBy(desc(signatureRequests.createdAt)).limit(limit);
  const enriched = await Promise.all(requests.map(async (request) => {
    const signers = await db.select().from(signatureSigners).where(eq(signatureSigners.requestId, request.id)).orderBy(asc(signatureSigners.orderIndex));
    const audits = await db.select({ action: auditLogs.action, description: auditLogs.description, status: auditLogs.status, createdAt: auditLogs.createdAt, newValue: auditLogs.newValue }).from(auditLogs).where(and(eq(auditLogs.entityType, "signature_request"), eq(auditLogs.entityId, request.id))).orderBy(desc(auditLogs.createdAt));
    return {
      id: request.id,
      documentId: request.documentId,
      subject: request.subject,
      status: request.status,
      completedAt: request.completedAt,
      signers: signers.map((signer) => {
        const event = audits.find((audit) => ["EMAIL_SENT", "EMAIL_FAILED", "EMAIL_SKIPPED"].includes(audit.action) && Boolean(audit.description?.includes(signer.signerEmail)));
        let messageId: string | null = null;
        if (event?.newValue) { try { messageId = JSON.parse(event.newValue).messageId ?? null; } catch { messageId = null; } }
        return {
          id: signer.id,
          name: signer.signerName,
          email: signer.signerEmail,
          status: resolveSignatureDeliveryStatus(event?.action, request.status),
          lastAttemptAt: event?.createdAt ?? null,
          detail: event?.description ?? null,
          messageId,
        } as const;
      }),
    };
  }));
  const summary = { sent: 0, failed: 0, skipped: 0, pending: 0, notReady: 0 };
  for (const request of enriched) for (const signer of request.signers) {
    if (signer.status === "sent") summary.sent += 1;
    else if (signer.status === "failed") summary.failed += 1;
    else if (signer.status === "skipped") summary.skipped += 1;
    else if (signer.status === "pending") summary.pending += 1;
    else summary.notReady += 1;
  }
  return { summary, requests: enriched };
}

export async function cancelSignatureRequest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(signatureRequests).set({ status: "cancelled" }).where(and(eq(signatureRequests.id, id), ne(signatureRequests.status, "completed")));
  return getSignatureRequestById(id);
}

// ============ PURCHASES & SUPPLIERS ============
export async function getSuppliers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).orderBy(asc(suppliers.name));
}

export async function createSupplier(data: typeof suppliers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(suppliers).values(data);
  return db.select().from(suppliers).where(eq(suppliers.id, Number(result[0].insertId))).limit(1).then((rows) => rows[0]);
}

export async function updateSupplier(id: number, data: Partial<typeof suppliers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(data).where(eq(suppliers.id, id));
  return db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1).then((rows) => rows[0]);
}
export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1).then((rows) => rows[0]);
}

export async function getPurchaseRequests() {
  const db = await getDb();
  if (!db) return [];
  const requests = await db.select().from(purchaseRequests).orderBy(desc(purchaseRequests.createdAt));
  const supplierRows = await db.select({ id: suppliers.id, name: suppliers.name }).from(suppliers);
  const supplierNames = new Map(supplierRows.map((supplier) => [supplier.id, supplier.name]));
  return requests.map((request) => ({ ...request, supplierName: request.supplierId ? supplierNames.get(request.supplierId) ?? null : null }));
}

export async function createPurchaseRequest(data: typeof purchaseRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseRequests).values(data);
  return db.select().from(purchaseRequests).where(eq(purchaseRequests.id, Number(result[0].insertId))).limit(1).then((rows) => rows[0]);
}
export async function getPurchaseRequestById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(purchaseRequests).where(eq(purchaseRequests.id, id)).limit(1).then((rows) => rows[0]);
}

export async function getPurchaseBudgetStatus(projectId: number, category: string, requestedAmount: number, requestedCurrency: "EUR" | "XOF" = "XOF") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const budgetRows = await db.select({ allocated: sql<number>`coalesce(sum(cast(${projectBudgetItems.amount} as decimal(15,2))), 0)`, spent: sql<number>`coalesce(sum(cast(${projectBudgetItems.spent} as decimal(15,2))), 0)` }).from(projectBudgetItems).where(and(eq(projectBudgetItems.projectId, projectId), eq(projectBudgetItems.category, category)));
  const committedRows = await db.select({ amount: purchaseRequests.amount, currency: purchaseRequests.currency }).from(purchaseRequests).where(and(eq(purchaseRequests.projectId, projectId), eq(purchaseRequests.category, category), inArray(purchaseRequests.status, ["submitted", "approved", "ordered", "received"])));
  const allocated = Number(budgetRows[0]?.allocated ?? 0);
  const spent = Number(budgetRows[0]?.spent ?? 0);
  const committed = committedRows.reduce((sum, row) => sum + Number(row.amount) * (row.currency === "EUR" ? 655.957 : 1), 0);
  const requestedAmountInBudgetCurrency = requestedAmount * (requestedCurrency === "EUR" ? 655.957 : 1);
  const remaining = allocated - spent - committed;
  return { allocated, spent, committed, remaining, requestedAmount, requestedCurrency, requestedAmountInBudgetCurrency, budgetCurrency: "XOF" as const, withinBudget: allocated <= 0 || remaining >= requestedAmountInBudgetCurrency };
}

export async function updatePurchaseRequest(id: number, data: Partial<typeof purchaseRequests.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(purchaseRequests).set(data).where(eq(purchaseRequests.id, id));
  return db.select().from(purchaseRequests).where(eq(purchaseRequests.id, id)).limit(1).then((rows) => rows[0]);
}

export async function getPurchaseQuotes(purchaseRequestId?: number) {
  const db = await getDb();
  if (!db) return [];
  return purchaseRequestId ? db.select().from(purchaseQuotes).where(eq(purchaseQuotes.purchaseRequestId, purchaseRequestId)) : db.select().from(purchaseQuotes).orderBy(desc(purchaseQuotes.createdAt));
}

export async function createPurchaseQuote(data: typeof purchaseQuotes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(purchaseQuotes).values(data);
  return db.select().from(purchaseQuotes).where(eq(purchaseQuotes.id, Number(result[0].insertId))).limit(1).then((rows) => rows[0]);
}
export async function selectPurchaseQuote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const quote = await db.select().from(purchaseQuotes).where(eq(purchaseQuotes.id, id)).limit(1).then((rows) => rows[0]);
  if (!quote) return undefined;
  if (quote.validUntil && new Date(quote.validUntil).getTime() < Date.now()) throw new Error("Devis expiré");
  await db.transaction(async (tx) => {
    await tx.update(purchaseQuotes).set({ status: "rejected" }).where(eq(purchaseQuotes.purchaseRequestId, quote.purchaseRequestId));
    await tx.update(purchaseQuotes).set({ status: "selected" }).where(eq(purchaseQuotes.id, id));
  });
  return db.select().from(purchaseQuotes).where(eq(purchaseQuotes.id, id)).limit(1).then((rows) => rows[0]);
}

// ============ EMAIL HISTORY ============

export async function getEmailHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emailHistory)
    .orderBy(desc(emailHistory.createdAt))
    .limit(limit);
}

type EmailCampaignSummaryRow = { status: "pending" | "sending" | "sent" | "failed"; recipientCount: number; successCount: number | null; failureCount: number | null };

export function summarizeEmailCampaigns(history: EmailCampaignSummaryRow[]) {
  const totalRecipients = history.reduce((sum, item) => sum + (item.recipientCount ?? 0), 0);
  const successfulRecipients = history.reduce((sum, item) => sum + (item.successCount ?? 0), 0);
  const failedRecipients = history.reduce((sum, item) => sum + (item.failureCount ?? 0), 0);
  return {
    totalCampaigns: history.length,
    sentCampaigns: history.filter((item) => item.status === "sent").length,
    failedCampaigns: history.filter((item) => item.status === "failed").length,
    activeCampaigns: history.filter((item) => item.status === "pending" || item.status === "sending").length,
    totalRecipients,
    successfulRecipients,
    failedRecipients,
    deliveryRate: totalRecipients > 0 ? Math.round((successfulRecipients / totalRecipients) * 1000) / 10 : 0,
  };
}

export async function getEmailCampaignStatistics() {
  return summarizeEmailCampaigns(await getEmailHistory(500));
}

export async function getEmailHistoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailHistory).where(eq(emailHistory.id, id)).limit(1);
  return result[0];
}

export async function createEmailHistory(data: InsertEmailHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailHistory).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateEmailHistory(id: number, data: Partial<InsertEmailHistory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailHistory).set(data).where(eq(emailHistory.id, id));
  return getEmailHistoryById(id);
}

// ============ EMAIL RECIPIENTS ============

export async function getEmailRecipients(emailHistoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emailRecipients)
    .where(eq(emailRecipients.emailHistoryId, emailHistoryId));
}

export async function createEmailRecipient(data: InsertEmailRecipient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emailRecipients).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateEmailRecipient(id: number, data: Partial<InsertEmailRecipient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emailRecipients).set(data).where(eq(emailRecipients.id, id));
}


// ============ APP SETTINGS ============

export async function getAppSetting(key: string): Promise<AppSetting | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return result[0];
}

export async function getAllAppSettings(): Promise<AppSetting[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(appSettings);
}

export async function updateAppSetting(key: string, value: string, updatedBy: number, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getAppSetting(key);
  if (existing) {
    await db.update(appSettings).set({ value, description, updatedBy, updatedAt: new Date().toISOString() }).where(eq(appSettings.key, key));
    return getAppSetting(key);
  } else {
    const result = await db.insert(appSettings).values({
      key,
      value,
      description,
      type: "string",
      updatedBy,
    });
    return { id: result[0].insertId, key, value, description, type: "string", updatedBy, updatedAt: new Date().toISOString(), createdAt: new Date() };
  }
}

export async function deleteAppSetting(key: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(appSettings).where(eq(appSettings.key, key));
}

// ============ CRM CONTACTS FUNCTIONS ============
export async function createCrmContact(data: InsertCrmContact): Promise<CrmContact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await (db as any).insert(crmContacts).values(data);
  const contact = await (db as any).query.crmContacts.findFirst({ where: eq(crmContacts.id, result[0].insertId) });
  return contact as CrmContact;
}

export async function getCrmContact(id: number): Promise<CrmContact | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (db as any).query.crmContacts.findFirst({ where: eq(crmContacts.id, id) });
}

export async function listCrmContacts(filters?: { segment?: string; status?: string; search?: string }): Promise<CrmContact[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let query = (db as any).query.crmContacts.findMany();
  return query as Promise<CrmContact[]>;
}

export async function updateCrmContact(id: number, data: Partial<InsertCrmContact>): Promise<CrmContact> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await (db as any).update(crmContacts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(crmContacts.id, id));
  const contact = await (db as any).query.crmContacts.findFirst({ where: eq(crmContacts.id, id) });
  return contact as CrmContact;
}

export async function deleteCrmContact(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await (db as any).delete(crmContacts).where(eq(crmContacts.id, id));
}

// ============ CRM ACTIVITIES FUNCTIONS ============
export async function createCrmActivity(data: InsertCrmActivity): Promise<CrmActivity> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await (db as any).insert(crmActivities).values(data);
  const activity = await (db as any).query.crmActivities.findFirst({ where: eq(crmActivities.id, result[0].insertId) });
  return activity as CrmActivity;
}

export async function listCrmActivities(contactId: number): Promise<CrmActivity[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (db as any).query.crmActivities.findMany({ where: eq(crmActivities.contactId, contactId) });
}

export async function updateCrmActivity(id: number, data: Partial<InsertCrmActivity>): Promise<CrmActivity> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await (db as any).update(crmActivities).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(crmActivities.id, id));
  const activity = await (db as any).query.crmActivities.findFirst({ where: eq(crmActivities.id, id) });
  return activity as CrmActivity;
}

export async function deleteCrmActivity(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await (db as any).delete(crmActivities).where(eq(crmActivities.id, id));
}

// ============ ADHESION PIPELINE FUNCTIONS ============
export async function createAdhesionPipeline(data: InsertAdhesionPipeline): Promise<AdhesionPipeline> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await (db as any).insert(adhesionPipeline).values(data);
  const pipeline = await (db as any).query.adhesionPipeline.findFirst({ where: eq(adhesionPipeline.id, result[0].insertId) });
  return pipeline as AdhesionPipeline;
}

export async function updateAdhesionPipeline(id: number, data: Partial<InsertAdhesionPipeline>): Promise<AdhesionPipeline> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await (db as any).update(adhesionPipeline).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(adhesionPipeline.id, id));
  const pipeline = await (db as any).query.adhesionPipeline.findFirst({ where: eq(adhesionPipeline.id, id) });
  return pipeline as AdhesionPipeline;
}

export async function listAdhesionPipeline(stage?: string): Promise<AdhesionPipeline[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (db as any).query.adhesionPipeline.findMany();
}

// ============ CRM REPORTS FUNCTIONS ============
export async function createCrmReport(data: InsertCrmReport): Promise<CrmReport> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await (db as any).insert(crmReports).values(data);
  const report = await (db as any).query.crmReports.findFirst({ where: eq(crmReports.id, result[0].insertId as any) });
  return report as CrmReport;
}

export async function listCrmReports(type?: string): Promise<CrmReport[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const reports = await (db as any).query.crmReports.findMany() as any;
  return reports;
}

// ============ CRM EMAIL INTEGRATION FUNCTIONS ============
export async function createCrmEmailIntegration(data: InsertCrmEmailIntegration): Promise<CrmEmailIntegration> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await (db as any).insert(crmEmailIntegration).values(data);
  const email = await (db as any).query.crmEmailIntegration.findFirst({ where: eq(crmEmailIntegration.id, result[0].insertId as any) });
  return email as CrmEmailIntegration;
}

export async function listCrmEmailIntegration(contactId: number): Promise<CrmEmailIntegration[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const emails = await (db as any).query.crmEmailIntegration.findMany({ where: eq(crmEmailIntegration.contactId, contactId) }) as any;
  return emails;
}


// Global Settings Management
export async function getGlobalSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(globalSettings).limit(1);
  return result[0];
}

export async function updateGlobalSettings(data: Partial<InsertGlobalSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if settings exist
  const existing = await getGlobalSettings();
  
  if (existing) {
    // Update existing
    await db.update(globalSettings).set(data).where(eq(globalSettings.id, existing.id));
    return getGlobalSettings();
  } else {
    // Create new
    const result = await db.insert(globalSettings).values(data as InsertGlobalSettings);
    return getGlobalSettings();
  }
}

export async function initializeGlobalSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getGlobalSettings();
  if (!existing) {
    await db.insert(globalSettings).values({
      associationName: "Les Bâtisseurs Engagés",
      seatCity: "N'djaména-tchad",
      folio: "10512",
      email: "contact.lesbatisseursengages@gmail.com",
      website: "www.lesbatisseursengage.com",
      phone: "",
      logo: null,
      description: "",
    });
  }
  return getGlobalSettings();
}

// ============ PASSWORD RESET REQUESTS ============

export async function createPasswordResetRequest(data: InsertPasswordResetRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(passwordResetRequests).values(data);
  const id = result[0].insertId;
  
  const rows = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.id, Number(id)));
  return rows[0];
}

export async function getPasswordResetRequest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rows = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.id, id));
  return rows[0];
}

export async function getPasswordResetRequestByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rows = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.email, email));
  return rows[0];
}

export async function getPasswordResetRequestByToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rows = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.token, token));
  return rows[0];
}

export async function listPasswordResetRequests(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rows = await db.select().from(passwordResetRequests).orderBy(desc(passwordResetRequests.createdAt)).limit(limit).offset(offset);
  return rows;
}

export async function updatePasswordResetRequest(id: number, data: Partial<InsertPasswordResetRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(passwordResetRequests).set(data).where(eq(passwordResetRequests.id, id));
  
  return getPasswordResetRequest(id);
}

export async function deletePasswordResetRequest(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(passwordResetRequests).where(eq(passwordResetRequests.id, id));
  return { success: true };
}

// ============ PROJECTS ============

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projects).values(data);
  const id = result[0].insertId;
  
  const rows = await db.select().from(projects).where(eq(projects.id, Number(id)));
  return rows[0];
}

export async function getProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rows = await db.select().from(projects).where(eq(projects.id, id));
  return rows[0];
}

export async function listProjects(limit = 50, offset = 0, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query: any = db.select().from(projects).orderBy(desc(projects.createdAt));
  
  if (status) {
    query = db.select().from(projects).where(eq(projects.status, status as any)).orderBy(desc(projects.createdAt));
  }
  
  const rows = await query.limit(limit).offset(offset);
  const leaderIds: number[] = Array.from(new Set(rows.map((project: typeof projects.$inferSelect) => project.leaderId).filter((id: number | null | undefined): id is number => typeof id === "number")));
  const leaders = leaderIds.length
    ? await db.select({ id: members.id, firstName: members.firstName, lastName: members.lastName }).from(members).where(inArray(members.id, leaderIds))
    : [];
  const leaderById = new Map(leaders.map((leader) => [leader.id, `${leader.firstName} ${leader.lastName}`]));
  return rows.map((project: typeof projects.$inferSelect) => ({
    ...project,
    leaderName: leaderById.get(project.leaderId) ?? null,
  }));
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projects).set(data).where(eq(projects.id, id));
  
  return getProject(id);
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projects).where(eq(projects.id, id));
  return { success: true };
}

// Project Members
export async function addProjectMember(data: InsertProjectMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectMembers).values(data);
  const id = result[0].insertId;
  
  const rows = await db.select().from(projectMembers).where(eq(projectMembers.id, Number(id)));
  return rows[0];
}

export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
}

export async function removeProjectMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectMembers).where(eq(projectMembers.id, id));
  return { success: true };
}

// Project Tasks
export async function createProjectTask(data: InsertProjectTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectTasks).values(data);
  const id = result[0].insertId;
  
  const rows = await db.select().from(projectTasks).where(eq(projectTasks.id, Number(id)));
  return rows[0];
}

export async function getProjectTasks(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId)).orderBy(desc(projectTasks.createdAt));
}

export async function updateProjectTask(id: number, data: Partial<InsertProjectTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectTasks).set(data).where(eq(projectTasks.id, id));
  
  const rows = await db.select().from(projectTasks).where(eq(projectTasks.id, id));
  return rows[0];
}

export async function deleteProjectTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectTasks).where(eq(projectTasks.id, id));
  return { success: true };
}

// Project Milestones
export async function createProjectMilestone(data: InsertProjectMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectMilestones).values(data);
  const id = result[0].insertId;
  
  const rows = await db.select().from(projectMilestones).where(eq(projectMilestones.id, Number(id)));
  return rows[0];
}

export async function getProjectMilestones(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectMilestones).where(eq(projectMilestones.projectId, projectId)).orderBy(projectMilestones.dueDate);
}

export async function updateProjectMilestone(id: number, data: Partial<InsertProjectMilestone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectMilestones).set(data).where(eq(projectMilestones.id, id));
  
  const rows = await db.select().from(projectMilestones).where(eq(projectMilestones.id, id));
  return rows[0];
}

export async function deleteProjectMilestone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectMilestones).where(eq(projectMilestones.id, id));
  return { success: true };
}

// Project Updates
export async function createProjectUpdate(data: InsertProjectUpdate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectUpdates).values(data);
  const id = result[0].insertId;
  
  const rows = await db.select().from(projectUpdates).where(eq(projectUpdates.id, Number(id)));
  return rows[0];
}

export async function getProjectUpdates(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectUpdates).where(eq(projectUpdates.projectId, projectId)).orderBy(desc(projectUpdates.createdAt));
}

// Project Impact Indicators
export async function getProjectImpactIndicators(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(projectImpactIndicators)
    .where(eq(projectImpactIndicators.projectId, projectId))
    .orderBy(desc(projectImpactIndicators.updatedAt));
}

export async function createProjectImpactIndicator(data: InsertProjectImpactIndicator) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectImpactIndicators).values(data);
  const id = Number(result[0].insertId);
  const rows = await db.select().from(projectImpactIndicators).where(eq(projectImpactIndicators.id, id));
  return rows[0];
}

export async function updateProjectImpactIndicator(id: number, data: Partial<InsertProjectImpactIndicator>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projectImpactIndicators).set(data).where(eq(projectImpactIndicators.id, id));
  const rows = await db.select().from(projectImpactIndicators).where(eq(projectImpactIndicators.id, id));
  return rows[0];
}

export async function deleteProjectImpactIndicator(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectImpactIndicators).where(eq(projectImpactIndicators.id, id));
  return { success: true };
}

// Project Task Comments
export async function createProjectTaskComment(data: InsertProjectTaskComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(projectTaskComments).values(data);
  const id = result[0].insertId;
  const rows = await db.select().from(projectTaskComments).where(eq(projectTaskComments.id, Number(id)));
  return rows[0];
}

export async function getProjectTaskComments(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(projectTaskComments)
    .where(eq(projectTaskComments.taskId, taskId))
    .orderBy(projectTaskComments.createdAt);
}

export async function deleteProjectTaskComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(projectTaskComments).where(eq(projectTaskComments.id, id));
  return { success: true };
}

export async function getProjectReport(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [project, taskMetrics, overdueTasks, milestoneMetrics, budgetMetrics, updateCount, commentCount] = await Promise.all([
    getProject(projectId),
    db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when status = 'in-progress' then 1 else 0 end)`,
    }).from(projectTasks).where(eq(projectTasks.projectId, projectId)),
    db.select({ count: sql<number>`count(*)` }).from(projectTasks).where(and(
      eq(projectTasks.projectId, projectId),
      lt(projectTasks.dueDate, new Date().toISOString()),
      ne(projectTasks.status, "completed"),
    )),
    db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
    }).from(projectMilestones).where(eq(projectMilestones.projectId, projectId)),
    db.select({
      budget: sql<number>`coalesce(sum(cast(amount as decimal(15,2))), 0)`,
      spent: sql<number>`coalesce(sum(cast(spent as decimal(15,2))), 0)`,
    }).from(projectBudgetItems).where(eq(projectBudgetItems.projectId, projectId)),
    db.select({ count: sql<number>`count(*)` }).from(projectUpdates).where(eq(projectUpdates.projectId, projectId)),
    db.select({ count: sql<number>`count(*)` }).from(projectTaskComments).where(eq(projectTaskComments.projectId, projectId)),
  ]);

  const tasks = taskMetrics[0] ?? { total: 0, completed: 0, inProgress: 0 };
  const milestones = milestoneMetrics[0] ?? { total: 0, completed: 0 };
  const budget = budgetMetrics[0] ?? { budget: 0, spent: 0 };
  const taskTotal = Number(tasks.total ?? 0);
  const taskCompleted = Number(tasks.completed ?? 0);
  const progressPercentage = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 0;

  return {
    project,
    tasks: {
      total: taskTotal,
      completed: taskCompleted,
      inProgress: Number(tasks.inProgress ?? 0),
      overdue: Number(overdueTasks[0]?.count ?? 0),
    },
    milestones: {
      total: Number(milestones.total ?? 0),
      completed: Number(milestones.completed ?? 0),
    },
    budget: {
      planned: Number(budget.budget ?? 0),
      spent: Number(budget.spent ?? 0),
      remaining: Number(budget.budget ?? 0) - Number(budget.spent ?? 0),
    },
    progressPercentage,
    updatesCount: Number(updateCount[0]?.count ?? 0),
    commentsCount: Number(commentCount[0]?.count ?? 0),
    generatedAt: new Date().toISOString(),
  };
}

// Project Budget Items
export async function getProjectBudgetItems(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(projectBudgetItems).where(eq(projectBudgetItems.projectId, projectId));
}

export async function createProjectBudgetItem(data: InsertProjectBudgetItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(projectBudgetItems).values(data);
  const id = result[0].insertId;
  
  const rows = await db.select().from(projectBudgetItems).where(eq(projectBudgetItems.id, Number(id)));
  return rows[0];
}

export async function updateProjectBudgetItem(id: number, data: Partial<InsertProjectBudgetItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(projectBudgetItems).set(data).where(eq(projectBudgetItems.id, id));
  
  const rows = await db.select().from(projectBudgetItems).where(eq(projectBudgetItems.id, id));
  return rows[0];
}

export async function deleteProjectBudgetItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(projectBudgetItems).where(eq(projectBudgetItems.id, id));
  return { success: true };
}


// Dashboard Statistics Functions
export async function getDashboardStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [
    documentsCount,
    membersCount,
    projectsCount,
    totalFinance,
    recentDocuments,
    urgentTasks,
    activeProjects,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(documents).where(eq(documents.isArchived, 0)),
    db.select({ count: sql<number>`count(*)` }).from(members),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(inArray(projects.status, ["planning", "in-progress", "on-hold"])),
    db.select({ total: sql<number>`COALESCE(SUM(CAST(montant AS DECIMAL(10,2))), 0)` }).from(cotisations).where(eq(cotisations.statut, "payée")),
    db.select().from(documents).where(eq(documents.isArchived, 0)).orderBy(desc(documents.createdAt)).limit(5),
    db.select().from(projectTasks).where(eq(projectTasks.status, "todo")).orderBy(asc(projectTasks.dueDate)).limit(5),
    db.select().from(projects).where(inArray(projects.status, ["planning", "in-progress"])).orderBy(desc(projects.startDate)).limit(5),
  ]);

  return {
    documents: documentsCount[0]?.count || 0,
    members: membersCount[0]?.count || 0,
    projects: projectsCount[0]?.count || 0,
    finance: totalFinance[0]?.total || 0,
    recentDocuments: recentDocuments || [],
    urgentTasks: urgentTasks || [],
    activeProjects: activeProjects || [],
  };
}

export async function getProjectsStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [
    totalProjects,
    completedProjects,
    inProgressProjects,
    plannedProjects,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(projects),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "completed")),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "in-progress")),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "planning")),
  ]);

  const completed = completedProjects[0]?.count || 0;
  const inProgress = inProgressProjects[0]?.count || 0;
  const planned = plannedProjects[0]?.count || 0;
  const total = Math.max(totalProjects[0]?.count || 0, completed + inProgress + planned);

  return {
    total,
    completed,
    inProgress,
    planned,
  };
}

export async function getTasksStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    overdueTasks,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(projectTasks),
    db.select({ count: sql<number>`count(*)` }).from(projectTasks).where(eq(projectTasks.status, "completed")),
    db.select({ count: sql<number>`count(*)` }).from(projectTasks).where(eq(projectTasks.status, "in-progress")),
    db.select({ count: sql<number>`count(*)` }).from(projectTasks).where(eq(projectTasks.status, "todo")),
    db.select({ count: sql<number>`count(*)` }).from(projectTasks).where(and(
      lt(projectTasks.dueDate, new Date().toISOString()),
      ne(projectTasks.status, "completed")
    )),
  ]);

  return {
    total: totalTasks[0]?.count || 0,
    completed: completedTasks[0]?.count || 0,
    inProgress: inProgressTasks[0]?.count || 0,
    todo: todoTasks[0]?.count || 0,
    overdue: overdueTasks[0]?.count || 0,
  };
}


export async function getFinanceStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [allCotisations, allDons, allDepenses] = await Promise.all([
    db.select().from(cotisations),
    db.select().from(dons),
    db.select().from(depenses),
  ]);
  const totalCotisations = allCotisations.reduce((sum, item) => sum + toEurReference(item.montant, item.currency), 0);
  const paidCotisations = allCotisations.filter((item) => item.statut === "payée").reduce((sum, item) => sum + toEurReference(item.montant, item.currency), 0);
  const totalDons = allDons.reduce((sum, item) => sum + toEurReference(item.montant, item.currency), 0);
  const totalDepenses = allDepenses.reduce((sum, item) => sum + toEurReference(item.montant, item.currency), 0);

  return {
    totalCotisations,
    paidCotisations,
    totalDons,
    totalDepenses,
    currency: "EUR" as const,
    balance: paidCotisations + totalDons - totalDepenses,
  };
}

export async function getMembersStatistics() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [
    totalMembers,
    adminMembers,
    secretaryMembers,
    regularMembers,
    gradesRows,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(members),
    db.select({ count: sql<number>`count(*)` }).from(members).where(eq(members.role, "Président")),
    db.select({ count: sql<number>`count(*)` }).from(members).where(like(members.role, "%Secrétaire%")),
    db.select({ count: sql<number>`count(*)` }).from(members).where(eq(members.role, "Membre")),
    db.select({
      grade: memberGrades.currentGrade,
      count: sql<number>`count(*)`,
    }).from(memberGrades).groupBy(memberGrades.currentGrade),
  ]);

  const gradesBreakdown = gradesRows.reduce((acc, row) => {
    acc[row.grade] = row.count;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: totalMembers[0]?.count || 0,
    presidents: adminMembers[0]?.count || 0,
    secretaries: secretaryMembers[0]?.count || 0,
    regular: regularMembers[0]?.count || 0,
    gradesBreakdown,
  };
}


// ============ GLOBAL DASHBOARD SUMMARY ============

export async function getGlobalDashboardSummary() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = new Date();
  const nowIso = now.toISOString();
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [baseStats, documentStats, projectsStats, tasksStats, financeStats, membersStats, activeCampaignRows, campaignTotals, activeAdhesionRows, expiredAdhesionRows, pendingAdhesionRows, recentPayments, settingsRows] = await Promise.all([
    getDashboardStatistics(),
    getDocumentStats(),
    getProjectsStatistics(),
    getTasksStatistics(),
    getFinanceStatistics(),
    getMembersStatistics(),
    db.select({
      count: sql<number>`count(*)`,
      objective: sql<number>`COALESCE(SUM(CAST(objectif AS DECIMAL(15,2))), 0)`,
      collected: sql<number>`COALESCE(SUM(CAST(montantCollecte AS DECIMAL(15,2))), 0)`,
    }).from(campaigns).where(eq(campaigns.status, "active")),
    db.select({
      count: sql<number>`count(*)`,
      objective: sql<number>`COALESCE(SUM(CAST(objectif AS DECIMAL(15,2))), 0)`,
      collected: sql<number>`COALESCE(SUM(CAST(montantCollecte AS DECIMAL(15,2))), 0)`,
    }).from(campaigns),
    db.select({ count: sql<number>`count(*)` }).from(adhesions).where(and(
      eq(adhesions.status, "active"),
      gte(adhesions.dateExpiration, nowIso),
    )),
    db.select({ count: sql<number>`count(*)` }).from(adhesions).where(and(
      eq(adhesions.status, "active"),
      lte(adhesions.dateExpiration, nowIso),
    )),
    db.select({ count: sql<number>`count(*)` }).from(adhesions).where(eq(adhesions.status, "pending")),
    db.select({
      id: cotisations.id,
      memberId: cotisations.memberId,
      amount: cotisations.montant,
      status: cotisations.statut,
      createdAt: cotisations.createdAt,
    }).from(cotisations).where(and(
      eq(cotisations.statut, "payée"),
      gte(cotisations.createdAt, sevenDaysAgoIso),
    )).orderBy(desc(cotisations.createdAt)).limit(7),
    db.select().from(globalSettings).orderBy(desc(globalSettings.updatedAt)).limit(1),
  ]);

  const activeCampaign = activeCampaignRows[0] ?? { count: 0, objective: 0, collected: 0 };
  const allCampaigns = campaignTotals[0] ?? { count: 0, objective: 0, collected: 0 };
  const campaignObjective = Number(activeCampaign.objective ?? 0);
  const campaignCollected = Number(activeCampaign.collected ?? 0);
  const associationSettings = settingsRows[0] ?? null;
  const onboardingSteps = [
    {
      id: "association-profile",
      label: "Compléter les informations de l’association",
      description: "Nom, siège et adresse de contact",
      complete: Boolean(associationSettings?.associationName && associationSettings?.seatCity && associationSettings?.email),
    },
    {
      id: "first-member",
      label: "Ajouter le premier membre",
      description: "Commencer le registre des adhérents",
      complete: membersStats.total > 0,
    },
    {
      id: "first-document",
      label: "Déposer le premier document",
      description: "Centraliser un document utile à l’équipe",
      complete: Number(documentStats.total) > 0,
    },
    {
      id: "first-project",
      label: "Créer le premier projet",
      description: "Suivre une action avec une équipe",
      complete: projectsStats.total > 0,
    },
    {
      id: "first-campaign",
      label: "Lancer une campagne de collecte",
      description: "Suivre un objectif de financement réel",
      complete: Number(allCampaigns.count) > 0,
    },
  ];
  const completedOnboardingSteps = onboardingSteps.filter((step) => step.complete).length;

  return {
    documents: {
      total: Number(documentStats.total ?? 0),
      completed: Number(documentStats.completed ?? 0),
      recent: baseStats.recentDocuments ?? [],
    },
    members: membersStats,
    projects: projectsStats,
    tasks: tasksStats,
    finance: financeStats,
    campaigns: {
      active: Number(activeCampaign.count ?? 0),
      total: Number(allCampaigns.count ?? 0),
      objective: Number(allCampaigns.objective ?? 0),
      collected: Number(allCampaigns.collected ?? 0),
      activeObjective: campaignObjective,
      activeCollected: campaignCollected,
      activeProgress: campaignObjective > 0 ? Math.min(100, Math.round((campaignCollected / campaignObjective) * 100)) : 0,
    },
    adhesions: {
      active: Number(activeAdhesionRows[0]?.count ?? 0),
      expired: Number(expiredAdhesionRows[0]?.count ?? 0),
      pending: Number(pendingAdhesionRows[0]?.count ?? 0),
      totalRevenue: Number(financeStats.paidCotisations ?? 0),
    },
    recentPayments: recentPayments.map((payment) => ({
      id: payment.id,
      memberId: payment.memberId,
      amount: Number(payment.amount ?? 0),
      status: payment.status,
      createdAt: payment.createdAt,
    })),
    activity: {
      urgentTasks: baseStats.urgentTasks ?? [],
      activeProjects: baseStats.activeProjects ?? [],
    },
    onboarding: {
      steps: onboardingSteps,
      completed: completedOnboardingSteps,
      total: onboardingSteps.length,
      percentage: Math.round((completedOnboardingSteps / onboardingSteps.length) * 100),
    },
    generatedAt: nowIso,
  };
}

// ============ USER ROLE MANAGEMENT FUNCTIONS ============

/**
 * Get all users with their roles
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: users.id,
    openId: users.openId,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    lastSignedIn: users.lastSignedIn,
  }).from(users).orderBy(desc(users.createdAt));
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Update user role
 */
export async function updateUserRole(userId: number, newRole: "admin" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
    const targetRows = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const currentRole = targetRows[0]?.role;
  if (!currentRole) throw new Error("Utilisateur introuvable");

  // Check the last-admin invariant only when actually demoting an administrator.
  if (newRole === "user" && currentRole === "admin") {
    const adminCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "admin"));
    const currentAdminCount = Number(adminCount[0]?.count || 0);
    if (currentAdminCount <= 1) {
      throw new Error("Il doit y avoir au moins un administrateur");
    }
  }
  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
}

/**
 * Get admin count
 */
export async function getAdminCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "admin"));
  return result[0]?.count || 0;
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: number): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.role === "admin";
}

// Type definitions for Insert operations
export type InsertUser = typeof users.$inferInsert;
export type InsertCategory = typeof categories.$inferInsert;
export type InsertDocument = typeof documents.$inferInsert;
export type InsertDocumentNote = typeof documentNotes.$inferInsert;
export type InsertMember = typeof members.$inferInsert;
export type InsertDocumentPermission = typeof documentPermissions.$inferInsert;
export type InsertSignatureRequest = typeof signatureRequests.$inferInsert;
export type InsertSignatureSigner = typeof signatureSigners.$inferInsert;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type InsertCotisation = typeof cotisations.$inferInsert;
export type InsertMembershipFeeRule = typeof membershipFeeRules.$inferInsert;
export type InsertDon = typeof dons.$inferInsert;
export type InsertDepense = typeof depenses.$inferInsert;
export type InsertTransaction = typeof transactions.$inferInsert;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type InsertEmailHistory = typeof emailHistory.$inferInsert;
export type InsertEmailRecipient = typeof emailRecipients.$inferInsert;
export type InsertAppSetting = typeof appSettings.$inferInsert;
export type InsertCrmContact = typeof crmContacts.$inferInsert;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;
export type InsertAdhesionPipeline = typeof adhesionPipeline.$inferInsert;
export type InsertCrmReport = typeof crmReports.$inferInsert;
export type InsertCrmEmailIntegration = typeof crmEmailIntegration.$inferInsert;
export type InsertGlobalSettings = typeof globalSettings.$inferInsert;
export type InsertPasswordResetRequest = typeof passwordResetRequests.$inferInsert;
export type InsertProject = typeof projects.$inferInsert;
export type InsertProjectMember = typeof projectMembers.$inferInsert;
export type InsertProjectTask = typeof projectTasks.$inferInsert;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;
export type InsertProjectUpdate = typeof projectUpdates.$inferInsert;
export type InsertProjectTaskComment = typeof projectTaskComments.$inferInsert;
export type InsertProjectBudgetItem = typeof projectBudgetItems.$inferInsert;
export type InsertProjectImpactIndicator = typeof projectImpactIndicators.$inferInsert;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type InsertAnnouncement = typeof announcements.$inferInsert;
export type InsertNews = typeof news.$inferInsert;
export type InsertNewsComment = typeof newsComments.$inferInsert;

// Select types for queries
export type CrmContact = typeof crmContacts.$inferSelect;
export type CrmActivity = typeof crmActivities.$inferSelect;
export type AdhesionPipeline = typeof adhesionPipeline.$inferSelect;
export type CrmReport = typeof crmReports.$inferSelect;
export type CrmEmailIntegration = typeof crmEmailIntegration.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type DocumentNote = typeof documentNotes.$inferSelect;
export type Member = typeof members.$inferSelect;
export type DocumentPermission = typeof documentPermissions.$inferSelect;
export type SignatureRequest = typeof signatureRequests.$inferSelect;
export type SignatureSigner = typeof signatureSigners.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Cotisation = typeof cotisations.$inferSelect;
export type Don = typeof dons.$inferSelect;
export type Depense = typeof depenses.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailHistory = typeof emailHistory.$inferSelect;
export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type News = typeof news.$inferSelect;
export type NewsComment = typeof newsComments.$inferSelect;


// ==========================================
// Announcements & News Helpers
// ==========================================

export async function getAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  } catch (error) {
    console.error("Failed to get announcements:", error);
    return [];
  }
}

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(data);
  return Number(result[0].insertId);
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}

export async function getNewsList() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(news).orderBy(desc(news.createdAt));
  } catch (error) {
    console.error("Failed to get news list:", error);
    return [];
  }
}

export async function createNews(data: InsertNews) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(news).values(data);
  return Number(result[0].insertId);
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(newsComments).where(eq(newsComments.newsId, id));
  await db.delete(news).where(eq(news.id, id));
}

export async function getNewsComments(newsId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(newsComments).where(eq(newsComments.newsId, newsId)).orderBy(desc(newsComments.createdAt));
  } catch (error) {
    console.error("Failed to get news comments:", error);
    return [];
  }
}

export async function addNewsComment(data: InsertNewsComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(newsComments).values(data);
  return Number(result[0].insertId);
}

export async function deleteNewsComment(id: number, authorId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = authorId ? and(eq(newsComments.id, id), eq(newsComments.authorId, authorId)) : eq(newsComments.id, id);
  await db.delete(newsComments).where(conditions);
}


export type MemberRecipientFilters = {
  roles?: string[];
  statuses?: string[];
  excludeNoEmail?: boolean;
  excludedMemberIds?: number[];
};

export async function getFilteredMembers(filters: MemberRecipientFilters = {}) {
  const membersList = await getAllMembers();
  const roles = filters.roles?.filter(Boolean) ?? [];
  const statuses = filters.statuses?.filter(Boolean) ?? [];
  const excludedIds = new Set(filters.excludedMemberIds ?? []);

  return membersList.filter((member) => {
    if (roles.length > 0 && !roles.includes(member.role ?? "member")) return false;
    if (statuses.length > 0 && !statuses.includes(member.status)) return false;
    if (filters.excludeNoEmail && !member.email) return false;
    if (excludedIds.has(member.id)) return false;
    return true;
  });
}


// Member Evaluations & Grades
export async function createMemberEvaluation(data: {
  memberId: number;
  evaluatorId: number;
  score: number;
  gradeProposed: string;
  responsibilitiesAssigned?: string;
  comments: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(memberEvaluations).values({
    ...data,
    evaluatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  const evalId = Number(result[0].insertId);

  // Mettre à jour ou insérer le grade actuel du membre
  const existingGrade = await db.select().from(memberGrades).where(eq(memberGrades.memberId, data.memberId));
  if (existingGrade.length > 0) {
    await db.update(memberGrades).set({
      currentGrade: data.gradeProposed,
      currentResponsibilities: data.responsibilitiesAssigned || existingGrade[0].currentResponsibilities,
      lastEvaluationId: evalId,
      promotedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).where(eq(memberGrades.memberId, data.memberId));
  } else {
    await db.insert(memberGrades).values({
      memberId: data.memberId,
      currentGrade: data.gradeProposed,
      currentResponsibilities: data.responsibilitiesAssigned,
      lastEvaluationId: evalId,
      promotedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const rows = await db.select().from(memberEvaluations).where(eq(memberEvaluations.id, evalId));
  return rows[0];
}

export async function getMemberEvaluations(memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(memberEvaluations).where(eq(memberEvaluations.memberId, memberId)).orderBy(desc(memberEvaluations.evaluatedAt));
}

export async function getMemberGrade(memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select().from(memberGrades).where(eq(memberGrades.memberId, memberId));
  return rows[0] || { currentGrade: "Membre Adhérent", currentResponsibilities: null, promotedAt: new Date().toISOString() };
}
