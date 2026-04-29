import { eq, and, like, desc, asc, sql, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  categories, InsertCategory, Category,
  documents, InsertDocument, Document,
  documentNotes, InsertDocumentNote,
  members, InsertMember,
  documentPermissions, InsertDocumentPermission,
  activityLogs, InsertActivityLog,
  cotisations, InsertCotisation,
  dons, InsertDon,
  depenses, InsertDepense,
  transactions, InsertTransaction,
  emailTemplates, InsertEmailTemplate, EmailTemplate,
  emailHistory, InsertEmailHistory, EmailHistory,
  emailRecipients, InsertEmailRecipient, EmailRecipient,
  appSettings, InsertAppSetting, AppSetting,
  crmContacts, InsertCrmContact, CrmContact,
  crmActivities, InsertCrmActivity, CrmActivity,
  adhesionPipeline, InsertAdhesionPipeline, AdhesionPipeline,
  crmReports, InsertCrmReport, CrmReport,
  crmEmailIntegration, InsertCrmEmailIntegration, CrmEmailIntegration,
  globalSettings, InsertGlobalSettings, GlobalSettings,
  passwordResetRequests, InsertPasswordResetRequest, PasswordResetRequest
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

const schema = {
  users,
  categories,
  documents,
  documentNotes,
  members,
  documentPermissions,
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
  passwordResetRequests
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
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
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
  isArchived?: boolean;
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
        like(documents.description, `%${filters.search}%`)
      )
    );
  }
  if (filters?.isArchived !== undefined) {
    conditions.push(eq(documents.isArchived, filters.isArchived));
  } else {
    conditions.push(eq(documents.isArchived, false));
  }

  if (conditions.length > 0) {
    return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.updatedAt));
  }
  
  return db.select().from(documents).where(eq(documents.isArchived, false)).orderBy(desc(documents.updatedAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
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

export async function getDocumentStats() {
  const db = await getDb();
  if (!db) return { total: 0, completed: 0, inProgress: 0, pending: 0, urgent: 0 };

  const allDocs = await db.select().from(documents).where(eq(documents.isArchived, false));
  
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
  return db.select().from(documentNotes).where(eq(documentNotes.documentId, documentId)).orderBy(desc(documentNotes.createdAt));
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

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(members).where(eq(members.id, id)).limit(1);
  return result[0];
}

export async function createMember(data: InsertMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(members).values(data);
  return { id: result[0].insertId, ...data };
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

export async function getFinancialStats() {
  const db = await getDb();
  if (!db) return null;
  
  const allCotisations = await db.select().from(cotisations);
  const allDons = await db.select().from(dons);
  const allDepenses = await db.select().from(depenses);
  
  const totalCotisations = allCotisations.reduce((sum, c) => sum + parseFloat(c.montant), 0);
  const totalDons = allDons.reduce((sum, d) => sum + parseFloat(d.montant), 0);
  const totalDepenses = allDepenses.reduce((sum, d) => sum + parseFloat(d.montant), 0);
  
  const cotisationsPayees = allCotisations.filter(c => c.statut === "payée").length;
  const cotisationsEnAttente = allCotisations.filter(c => c.statut === "en attente").length;
  const cotisationsEnRetard = allCotisations.filter(c => c.statut === "en retard").length;
  
  return {
    totalCotisations,
    totalDons,
    totalDepenses,
    solde: totalCotisations + totalDons - totalDepenses,
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

// ============ EMAIL HISTORY ============

export async function getEmailHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emailHistory)
    .orderBy(desc(emailHistory.createdAt))
    .limit(limit);
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
    await db.update(appSettings).set({ value, description, updatedBy, updatedAt: new Date() }).where(eq(appSettings.key, key));
    return getAppSetting(key);
  } else {
    const result = await db.insert(appSettings).values({
      key,
      value,
      description,
      type: "string",
      updatedBy,
    });
    return { id: result[0].insertId, key, value, description, type: "string", updatedBy, updatedAt: new Date(), createdAt: new Date() };
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
  await (db as any).update(crmContacts).set({ ...data, updatedAt: new Date() }).where(eq(crmContacts.id, id));
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
  await (db as any).update(crmActivities).set({ ...data, updatedAt: new Date() }).where(eq(crmActivities.id, id));
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
  await (db as any).update(adhesionPipeline).set({ ...data, updatedAt: new Date() }).where(eq(adhesionPipeline.id, id));
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
