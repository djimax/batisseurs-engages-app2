import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, date, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Document categories for organization
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#1a4d2e"),
  icon: varchar("icon", { length: 50 }).default("folder"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Documents table - main entity for document management
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: int("categoryId").notNull(),
  status: mysqlEnum("status", ["pending", "in-progress", "completed"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  
  // File storage info
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  fileName: varchar("fileName", { length: 255 }),
  fileType: varchar("fileType", { length: 100 }),
  fileSize: int("fileSize"),
  
  // Metadata
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  dueDate: timestamp("dueDate"),
  isArchived: boolean("isArchived").default(false),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Document notes/comments
 */
export const documentNotes = mysqlTable("document_notes", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DocumentNote = typeof documentNotes.$inferSelect;
export type InsertDocumentNote = typeof documentNotes.$inferInsert;

/**
 * Members table for association members management
 */
export const members = mysqlTable("members", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 100 }).default("Membre"), // Peut être: Président, Secrétaire Général, Secrétaire Général Adjoint, Trésorier Général, Trésorier Général Adjoint, Membre
  function: varchar("function", { length: 100 }),
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type InsertMember = typeof members.$inferInsert;

/**
 * Document access permissions
 */
export const documentPermissions = mysqlTable("document_permissions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  memberId: int("memberId").notNull(),
  canView: boolean("canView").default(true),
  canEdit: boolean("canEdit").default(false),
  canDelete: boolean("canDelete").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentPermission = typeof documentPermissions.$inferSelect;
export type InsertDocumentPermission = typeof documentPermissions.$inferInsert;

/**
 * Activity log for tracking actions
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;


/**
 * Cotisations table - membership fees
 */
export const cotisations = mysqlTable("cotisations", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  montant: varchar("montant", { length: 20 }).notNull(),
  dateDebut: timestamp("dateDebut").notNull(),
  dateFin: timestamp("dateFin").notNull(),
  statut: mysqlEnum("statut", ["payée", "en attente", "en retard"]).default("en attente").notNull(),
  datePayment: timestamp("datePayment"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cotisation = typeof cotisations.$inferSelect;
export type InsertCotisation = typeof cotisations.$inferInsert;

/**
 * Dons table - donations received
 */
export const dons = mysqlTable("dons", {
  id: int("id").autoincrement().primaryKey(),
  donateur: varchar("donateur", { length: 255 }).notNull(),
  montant: varchar("montant", { length: 20 }).notNull(),
  description: text("description"),
  email: varchar("email", { length: 320 }),
  telephone: varchar("telephone", { length: 20 }),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Don = typeof dons.$inferSelect;
export type InsertDon = typeof dons.$inferInsert;

/**
 * Dépenses table - expenses
 */
export const depenses = mysqlTable("depenses", {
  id: int("id").autoincrement().primaryKey(),
  description: varchar("description", { length: 255 }).notNull(),
  montant: varchar("montant", { length: 20 }).notNull(),
  categorie: varchar("categorie", { length: 100 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  approuvePar: int("approuvePar"),
  notes: text("notes"),
  pieceJointe: text("pieceJointe"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Depense = typeof depenses.$inferSelect;
export type InsertDepense = typeof depenses.$inferInsert;

/**
 * Transactions table - all financial transactions
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["cotisation", "don", "depense", "autre"]).notNull(),
  montant: varchar("montant", { length: 20 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  memberId: int("memberId"),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Campaigns table - fundraising campaigns
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  objectif: varchar("objectif", { length: 20 }).notNull(),
  montantCollecte: varchar("montantCollecte", { length: 20 }).default("0").notNull(),
  dateDebut: timestamp("dateDebut").notNull(),
  dateFin: timestamp("dateFin").notNull(),
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  image: text("image"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Adhésions table - membership registrations
 */
export const adhesions = mysqlTable("adhesions", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  annee: int("annee").notNull(),
  montant: varchar("montant", { length: 20 }).notNull(),
  dateAdhesion: timestamp("dateAdhesion").notNull(),
  dateExpiration: timestamp("dateExpiration").notNull(),
  status: mysqlEnum("status", ["active", "expired", "pending"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Adhesion = typeof adhesions.$inferSelect;
export type InsertAdhesion = typeof adhesions.$inferInsert;

/**
 * Notifications table - system notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "warning", "error", "success"]).default("info").notNull(),
  isRead: boolean("isRead").default(false),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Association info table - organization details
 */
export const associationInfo = mysqlTable("association_info", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logo: text("logo"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  siret: varchar("siret", { length: 20 }),
  rib: varchar("rib", { length: 50 }),
  website: varchar("website", { length: 255 }),
  foundedAt: timestamp("foundedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssociationInfo = typeof associationInfo.$inferSelect;
export type InsertAssociationInfo = typeof associationInfo.$inferInsert;


/**
 * Events table - calendar events for the association
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  eventType: mysqlEnum("eventType", ["reunion", "formation", "activite", "evenement", "autre"]).default("autre").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  color: varchar("color", { length: 7 }).default("#1a4d2e"),
  organizer: varchar("organizer", { length: 255 }),
  attendees: int("attendees").default(0),
  image: text("image"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;


/**
 * Application users table - for managing usernames and passwords
 */
export const appUsers = mysqlTable("app_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(), // Hashed password
  email: varchar("email", { length: 320 }),
  fullName: varchar("fullName", { length: 255 }),
  role: mysqlEnum("role", ["admin", "membre"]).default("membre").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastLogin: timestamp("lastLogin"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;


/**
 * Audit log table - tracks all modifications
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userEmail: varchar("userEmail", { length: 255 }),
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE, LOGIN, EXPORT, IMPORT
  entityType: varchar("entityType", { length: 50 }).notNull(), // documents, members, finances, users, events, campaigns, etc.
  entityId: int("entityId"),
  entityName: varchar("entityName", { length: 255 }), // Name/title of the modified entity
  changes: text("changes"), // JSON with before/after values
  oldValue: text("oldValue"), // JSON - previous value
  newValue: text("newValue"), // JSON - new value
  description: text("description"), // Human-readable description
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: mysqlEnum("status", ["success", "failed"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Member statuses - track member status changes
 */
export const memberStatuses = mysqlTable("member_statuses", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended", "resigned", "deceased"]).notNull(),
  reason: text("reason"),
  changedBy: int("changedBy"),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemberStatus = typeof memberStatuses.$inferSelect;
export type InsertMemberStatus = typeof memberStatuses.$inferInsert;

/**
 * Member history - track all changes to member records
 */
export const memberHistory = mysqlTable("member_history", {
  id: int("id").autoincrement().primaryKey(),
  memberId: int("memberId").notNull(),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  changedBy: int("changedBy"),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemberHistory = typeof memberHistory.$inferSelect;
export type InsertMemberHistory = typeof memberHistory.$inferInsert;

/**
 * Roles - define roles in the association
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("isSystem").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * Permissions - define permissions for roles
 */
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

/**
 * Role permissions - link roles to permissions
 */
export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull(),
  permissionId: int("permissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

/**
 * User roles - assign roles to users
 */
export const userRoles = mysqlTable("user_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  roleId: int("roleId").notNull(),
  assignedBy: int("assignedBy"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

/**
 * Announcements - important announcements for the association
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: int("authorId").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * News - news articles for the association
 */
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  excerpt: varchar("excerpt", { length: 500 }),
  authorId: int("authorId").notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * News comments - comments on news articles
 */
export const newsComments = mysqlTable("news_comments", {
  id: int("id").autoincrement().primaryKey(),
  newsId: int("newsId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NewsComment = typeof newsComments.$inferSelect;
export type InsertNewsComment = typeof newsComments.$inferInsert;

/**
 * Email templates - reusable email templates
 */
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"),
  variables: text("variables"),
  isSystem: boolean("isSystem").default(false),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email history - track sent emails
 */
export const emailHistory = mysqlTable("email_history", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  recipientCount: int("recipientCount").notNull(),
  sentBy: int("sentBy").notNull(),
  status: mysqlEnum("status", ["pending", "sending", "sent", "failed"]).default("pending").notNull(),
  successCount: int("successCount").default(0),
  failureCount: int("failureCount").default(0),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailHistory = typeof emailHistory.$inferSelect;
export type InsertEmailHistory = typeof emailHistory.$inferInsert;

/**
 * Email recipients - track individual email recipients
 */
export const emailRecipients = mysqlTable("email_recipients", {
  id: int("id").autoincrement().primaryKey(),
  emailHistoryId: int("emailHistoryId").notNull(),
  recipientId: int("recipientId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = typeof emailRecipients.$inferInsert;

/**
 * Application Settings - global configuration
 */
export const appSettings = mysqlTable("app_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string").notNull(),
  updatedBy: int("updatedBy").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;


/**
 * CRM Contacts - detailed member profiles
 */
export const crmContacts = mysqlTable("crm_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }),
  birthDate: date("birthDate"),
  joinDate: date("joinDate"),
  segment: varchar("segment", { length: 50 }).default("general"),
  status: mysqlEnum("status", ["prospect", "active", "inactive", "archived"]).default("prospect").notNull(),
  notes: text("notes"),
  tags: varchar("tags", { length: 500 }),
  lastInteraction: timestamp("lastInteraction"),
  engagementScore: int("engagementScore").default(0),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;

/**
 * CRM Activities - track interactions with contacts
 */
export const crmActivities = mysqlTable("crm_activities", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  type: mysqlEnum("type", ["call", "email", "meeting", "task", "note", "event"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  completedDate: timestamp("completedDate"),
  assignedTo: int("assignedTo"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = typeof crmActivities.$inferInsert;

/**
 * Adhesion Pipeline - track membership application process
 */
export const adhesionPipeline = mysqlTable("adhesion_pipeline", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  stage: mysqlEnum("stage", ["inquiry", "application", "review", "approved", "rejected", "member"]).default("inquiry").notNull(),
  applicationDate: date("applicationDate"),
  approvalDate: date("approvalDate"),
  rejectionReason: text("rejectionReason"),
  notes: text("notes"),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdhesionPipeline = typeof adhesionPipeline.$inferSelect;
export type InsertAdhesionPipeline = typeof adhesionPipeline.$inferInsert;

/**
 * CRM Reports - store generated reports and metrics
 */
export const crmReports = mysqlTable("crm_reports", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["engagement", "pipeline", "activity", "segment", "custom"]).notNull(),
  description: text("description"),
  data: json("data"),
  filters: json("filters"),
  generatedBy: int("generatedBy").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmReport = typeof crmReports.$inferSelect;
export type InsertCrmReport = typeof crmReports.$inferInsert;

/**
 * CRM Email Integration - track email interactions with contacts
 */
export const crmEmailIntegration = mysqlTable("crm_email_integration", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  emailHistoryId: int("emailHistoryId"),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content"),
  direction: mysqlEnum("direction", ["sent", "received"]).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "bounced", "opened", "clicked"]).default("sent").notNull(),
  sentBy: int("sentBy"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmEmailIntegration = typeof crmEmailIntegration.$inferSelect;
export type InsertCrmEmailIntegration = typeof crmEmailIntegration.$inferInsert;


/**
 * Global Settings - store association information
 */
export const globalSettings = mysqlTable("global_settings", {
  id: int("id").autoincrement().primaryKey(),
  associationName: varchar("associationName", { length: 255 }).default("Les Bâtisseurs Engagés").notNull(),
  seatCity: varchar("seatCity", { length: 255 }).default("N'djaména-tchad").notNull(),
  folio: varchar("folio", { length: 100 }).default("10512").notNull(),
  email: varchar("email", { length: 320 }).default("contact.lesbatisseursengages@gmail.com").notNull(),
  website: varchar("website", { length: 500 }).default("www.lesbatisseursengage.com").notNull(),
  phone: varchar("phone", { length: 20 }),
  logo: text("logo"), // Base64 encoded logo
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GlobalSettings = typeof globalSettings.$inferSelect;
export type InsertGlobalSettings = typeof globalSettings.$inferInsert;


/**
 * Password Reset Requests - track password reset requests
 */
export const passwordResetRequests = mysqlTable("password_reset_requests", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  temporaryPassword: varchar("temporaryPassword", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertPasswordResetRequest = typeof passwordResetRequests.$inferInsert;
