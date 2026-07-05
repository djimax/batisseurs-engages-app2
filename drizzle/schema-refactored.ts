/**
 * Schéma de Base de Données Refactorisé
 * 
 * Ce fichier contient le schéma refactorisé avec :
 * - Correction de tous les problèmes tinyint
 * - Ajout des index manquants
 * - Ajout des contraintes de clés étrangères
 * - Ajout des tables antennes et groupes
 * - Ajout des tables de permissions granulaires
 * - Nommage cohérent
 */

import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, text, timestamp, mysqlEnum, date, index, json, foreignKey, unique, decimal } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

// ============================================================================
// UTILISATEURS ET AUTHENTIFICATION
// ============================================================================

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	username: varchar({ length: 100 }).notNull(),
	password: text().notNull(),
	email: varchar({ length: 320 }).notNull(),
	fullName: varchar({ length: 255 }),
	role: mysqlEnum(['admin','gestionnaire','membre','observateur']).default('membre').notNull(),
	isActive: int().default(1).notNull(),
	lastLogin: timestamp({ mode: 'string' }),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
	index("users_role_idx").on(table.role),
	index("users_isActive_idx").on(table.isActive),
]);

// ============================================================================
// STRUCTURE ORGANISATIONNELLE
// ============================================================================

export const antennes = mysqlTable("antennes", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	city: varchar({ length: 100 }).notNull(),
	address: text(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 320 }),
	responsibleId: int(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	unique("antennes_slug_unique").on(table.slug),
	index("antennes_city_idx").on(table.city),
	index("antennes_responsibleId_idx").on(table.responsibleId),
	foreignKey({ columns: [table.responsibleId], foreignColumns: [users.id] }).onDelete("set null"),
]);

export const groupes = mysqlTable("groupes", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	antenneId: int().notNull(),
	responsibleId: int(),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	unique("groupes_slug_unique").on(table.slug),
	index("groupes_antenneId_idx").on(table.antenneId),
	index("groupes_responsibleId_idx").on(table.responsibleId),
	foreignKey({ columns: [table.antenneId], foreignColumns: [antennes.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.responsibleId], foreignColumns: [users.id] }).onDelete("set null"),
]);

// ============================================================================
// MEMBRES ET ADHÉSIONS
// ============================================================================

export const members = mysqlTable("members", {
	id: int().autoincrement().notNull(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	phone: varchar({ length: 20 }),
	gender: mysqlEnum(['male','female','other']),
	birthDate: date({ mode: 'string' }),
	memberID: varchar({ length: 50 }).notNull(),
	role: varchar({ length: 100 }),
	photo: text(),
	address: text(),
	city: varchar({ length: 100 }),
	postalCode: varchar({ length: 20 }),
	country: varchar({ length: 100 }),
	antenneId: int(),
	groupeId: int(),
	status: mysqlEnum(['active','inactive','suspended','archived']).default('active').notNull(),
	joinDate: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	unique("members_memberID_unique").on(table.memberID),
	unique("members_email_unique").on(table.email),
	index("members_antenneId_idx").on(table.antenneId),
	index("members_groupeId_idx").on(table.groupeId),
	index("members_status_idx").on(table.status),
	foreignKey({ columns: [table.antenneId], foreignColumns: [antennes.id] }).onDelete("set null"),
	foreignKey({ columns: [table.groupeId], foreignColumns: [groupes.id] }).onDelete("set null"),
]);

export const adhesions = mysqlTable("adhesions", {
	id: int().autoincrement().notNull(),
	memberId: int().notNull(),
	year: int().notNull(),
	type: mysqlEnum(['standard','premium','beneficiary']).default('standard').notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	adhesionDate: timestamp({ mode: 'string' }).notNull(),
	expirationDate: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['active','expired','pending','cancelled']).default('pending').notNull(),
	paymentDate: timestamp({ mode: 'string' }),
	paymentMethod: varchar({ length: 50 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("adhesions_memberId_idx").on(table.memberId),
	index("adhesions_year_idx").on(table.year),
	index("adhesions_status_idx").on(table.status),
	foreignKey({ columns: [table.memberId], foreignColumns: [members.id] }).onDelete("cascade"),
]);

// ============================================================================
// PERMISSIONS ET RÔLES
// ============================================================================

export const roles = mysqlTable("roles", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isSystem: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	unique("roles_name_unique").on(table.name),
	index("roles_isSystem_idx").on(table.isSystem),
]);

export const permissions = mysqlTable("permissions", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	resource: varchar({ length: 50 }).notNull(),
	action: varchar({ length: 50 }).notNull(),
	isSystem: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	unique("permissions_resource_action_unique").on(table.resource, table.action),
	index("permissions_resource_idx").on(table.resource),
]);

export const rolePermissions = mysqlTable("role_permissions", {
	id: int().autoincrement().notNull(),
	roleId: int().notNull(),
	permissionId: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	unique("role_permissions_unique").on(table.roleId, table.permissionId),
	foreignKey({ columns: [table.roleId], foreignColumns: [roles.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.permissionId], foreignColumns: [permissions.id] }).onDelete("cascade"),
]);

export const userRoles = mysqlTable("user_roles", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	roleId: int().notNull(),
	antenneId: int(),
	groupeId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	unique("user_roles_unique").on(table.userId, table.roleId, table.antenneId, table.groupeId),
	index("user_roles_userId_idx").on(table.userId),
	index("user_roles_roleId_idx").on(table.roleId),
	foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.roleId], foreignColumns: [roles.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.antenneId], foreignColumns: [antennes.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.groupeId], foreignColumns: [groupes.id] }).onDelete("cascade"),
]);

// ============================================================================
// DOCUMENTS ET GESTION DE CONTENU
// ============================================================================

export const categories = mysqlTable("categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	color: varchar({ length: 7 }).default('#1a4d2e'),
	icon: varchar({ length: 50 }).default('folder'),
	sortOrder: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	unique("categories_slug_unique").on(table.slug),
	index("categories_sortOrder_idx").on(table.sortOrder),
]);

export const documents = mysqlTable("documents", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	categoryId: int().notNull(),
	status: mysqlEnum(['pending','in-progress','completed']).default('pending').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	fileUrl: text(),
	fileKey: varchar({ length: 500 }),
	fileName: varchar({ length: 255 }),
	fileType: varchar({ length: 100 }),
	fileSize: int(),
	createdBy: int(),
	updatedBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	dueDate: timestamp({ mode: 'string' }),
	isArchived: int().default(0).notNull(),
},
(table) => [
	index("documents_categoryId_idx").on(table.categoryId),
	index("documents_status_idx").on(table.status),
	index("documents_createdBy_idx").on(table.createdBy),
	index("documents_isArchived_idx").on(table.isArchived),
	foreignKey({ columns: [table.categoryId], foreignColumns: [categories.id] }).onDelete("restrict"),
	foreignKey({ columns: [table.createdBy], foreignColumns: [users.id] }).onDelete("set null"),
	foreignKey({ columns: [table.updatedBy], foreignColumns: [users.id] }).onDelete("set null"),
]);

export const documentPermissions = mysqlTable("document_permissions", {
	id: int().autoincrement().notNull(),
	documentId: int().notNull(),
	memberId: int().notNull(),
	canView: int().default(1).notNull(),
	canEdit: int().default(0).notNull(),
	canDelete: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	unique("document_permissions_unique").on(table.documentId, table.memberId),
	index("document_permissions_documentId_idx").on(table.documentId),
	index("document_permissions_memberId_idx").on(table.memberId),
	foreignKey({ columns: [table.documentId], foreignColumns: [documents.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.memberId], foreignColumns: [members.id] }).onDelete("cascade"),
]);

export const documentNotes = mysqlTable("document_notes", {
	id: int().autoincrement().notNull(),
	documentId: int().notNull(),
	userId: int().notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("document_notes_documentId_idx").on(table.documentId),
	index("document_notes_userId_idx").on(table.userId),
	foreignKey({ columns: [table.documentId], foreignColumns: [documents.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
]);

// ============================================================================
// PROJETS ET TÂCHES
// ============================================================================

export const projects = mysqlTable("projects", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['planning','active','on-hold','completed','cancelled']).default('planning').notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }),
	budget: decimal({ precision: 12, scale: 2 }),
	groupeId: int(),
	antenneId: int(),
	leaderId: int(),
	progress: int().default(0),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projects_status_idx").on(table.status),
	index("projects_groupeId_idx").on(table.groupeId),
	index("projects_antenneId_idx").on(table.antenneId),
	index("projects_leaderId_idx").on(table.leaderId),
	foreignKey({ columns: [table.groupeId], foreignColumns: [groupes.id] }).onDelete("set null"),
	foreignKey({ columns: [table.antenneId], foreignColumns: [antennes.id] }).onDelete("set null"),
	foreignKey({ columns: [table.leaderId], foreignColumns: [users.id] }).onDelete("set null"),
	foreignKey({ columns: [table.createdBy], foreignColumns: [users.id] }).onDelete("restrict"),
]);

export const tasks = mysqlTable("tasks", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	projectId: int().notNull(),
	status: mysqlEnum(['todo','in-progress','review','done','cancelled']).default('todo').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	assignedTo: int(),
	dueDate: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("tasks_projectId_idx").on(table.projectId),
	index("tasks_status_idx").on(table.status),
	index("tasks_assignedTo_idx").on(table.assignedTo),
	foreignKey({ columns: [table.projectId], foreignColumns: [projects.id] }).onDelete("cascade"),
	foreignKey({ columns: [table.assignedTo], foreignColumns: [users.id] }).onDelete("set null"),
	foreignKey({ columns: [table.createdBy], foreignColumns: [users.id] }).onDelete("restrict"),
]);

// ============================================================================
// NOTIFICATIONS ET COMMUNICATIONS
// ============================================================================

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	type: mysqlEnum(['info','warning','error','success']).default('info').notNull(),
	isRead: int().default(0).notNull(),
	actionUrl: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("notifications_userId_idx").on(table.userId),
	index("notifications_isRead_idx").on(table.isRead),
	foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
]);

export const emailTemplates = mysqlTable("email_templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	description: text(),
	category: varchar({ length: 50 }).default('general'),
	variables: text(),
	isSystem: int().default(0).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("email_templates_category_idx").on(table.category),
	index("email_templates_isSystem_idx").on(table.isSystem),
	foreignKey({ columns: [table.createdBy], foreignColumns: [users.id] }).onDelete("restrict"),
]);

// ============================================================================
// AUDIT ET LOGS
// ============================================================================

export const auditLogs = mysqlTable("audit_logs", {
	id: int().autoincrement().notNull(),
	userId: int(),
	userEmail: varchar({ length: 255 }),
	action: varchar({ length: 50 }).notNull(),
	entityType: varchar({ length: 50 }).notNull(),
	entityId: int(),
	entityName: varchar({ length: 255 }),
	changes: text(),
	oldValue: text(),
	newValue: text(),
	description: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	status: mysqlEnum(['success','failed']).default('success').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("audit_logs_userId_idx").on(table.userId),
	index("audit_logs_entityType_idx").on(table.entityType),
	index("audit_logs_createdAt_idx").on(table.createdAt),
	index("audit_logs_status_idx").on(table.status),
]);

export const activityLogs = mysqlTable("activity_logs", {
	id: int().autoincrement().notNull(),
	userId: int(),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar({ length: 50 }).notNull(),
	entityId: int(),
	details: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("activity_logs_userId_idx").on(table.userId),
	index("activity_logs_entityType_idx").on(table.entityType),
	index("activity_logs_createdAt_idx").on(table.createdAt),
	foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete("set null"),
]);

// ============================================================================
// CONFIGURATION SYSTÈME
// ============================================================================

export const globalSettings = mysqlTable("global_settings", {
	id: int().autoincrement().notNull(),
	associationName: varchar({ length: 255 }).default('Les Bâtisseurs Engagés').notNull(),
	seatCity: varchar({ length: 255 }).default('N\'djaména-tchad').notNull(),
	folio: varchar({ length: 100 }).default('10512').notNull(),
	email: varchar({ length: 320 }).default('contact.lesbatisseursengages@gmail.com').notNull(),
	website: varchar({ length: 500 }).default('www.lesbatisseursengage.com').notNull(),
	phone: varchar({ length: 20 }),
	logo: text(),
	description: text(),
	updatedBy: int(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	foreignKey({ columns: [table.updatedBy], foreignColumns: [users.id] }).onDelete("set null"),
]);

export const appSettings = mysqlTable("app_settings", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: text().notNull(),
	description: text(),
	type: mysqlEnum(['string','number','boolean','json']).default('string').notNull(),
	updatedBy: int().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	unique("app_settings_key_unique").on(table.key),
	index("app_settings_type_idx").on(table.type),
	foreignKey({ columns: [table.updatedBy], foreignColumns: [users.id] }).onDelete("restrict"),
]);
