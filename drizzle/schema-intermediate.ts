/**
 * Schéma Intermédiaire - Migration Progressive
 * 
 * Ce schéma conserve toutes les anciennes tables ET ajoute les nouvelles.
 * Cela permet une migration progressive et sûre sans perte de données.
 */

import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, text, timestamp, mysqlEnum, date, index, json, foreignKey, unique, decimal } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

// ============================================================================
// ANCIENNES TABLES (CONSERVÉES POUR COMPATIBILITÉ)
// ============================================================================

export const activityLogs = mysqlTable("activity_logs", {
	id: int().autoincrement().notNull(),
	userId: int(),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar({ length: 50 }).notNull(),
	entityId: int(),
	details: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const adhesionPipeline = mysqlTable("adhesion_pipeline", {
	id: int().autoincrement().notNull(),
	contactId: int().notNull(),
	stage: mysqlEnum(['inquiry','application','review','approved','rejected','member']).default('inquiry').notNull(),
	applicationDate: date({ mode: 'string' }),
	approvalDate: date({ mode: 'string' }),
	rejectionReason: text(),
	notes: text(),
	assignedTo: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const adhesions = mysqlTable("adhesions", {
	id: int().autoincrement().notNull(),
	memberId: int().notNull(),
	annee: int().notNull(),
	montant: varchar({ length: 20 }).notNull(),
	dateAdhesion: timestamp({ mode: 'string' }).notNull(),
	dateExpiration: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['active','expired','pending']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const announcements = mysqlTable("announcements", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	authorId: int().notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	status: mysqlEnum(['draft','published','archived']).default('draft').notNull(),
	publishedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

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
	index("app_settings_key_unique").on(table.key),
]);

export const appUsers = mysqlTable("app_users", {
	id: int().autoincrement().notNull(),
	username: varchar({ length: 100 }).notNull(),
	password: text().notNull(),
	email: varchar({ length: 320 }),
	fullName: varchar({ length: 255 }),
	role: mysqlEnum(['admin','membre']).default('membre').notNull(),
	isActive: int().default(1).notNull(),
	lastLogin: timestamp({ mode: 'string' }),
	createdBy: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("app_users_username_unique").on(table.username),
]);

export const associationInfo = mysqlTable("association_info", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	logo: text(),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	address: text(),
	siret: varchar({ length: 20 }),
	rib: varchar({ length: 50 }),
	website: varchar({ length: 255 }),
	foundedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("auditLogs", {
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
});

export const campaigns = mysqlTable("campaigns", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	objectif: varchar({ length: 20 }).notNull(),
	montantCollecte: varchar({ length: 20 }).default('0').notNull(),
	dateDebut: timestamp({ mode: 'string' }).notNull(),
	dateFin: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['draft','active','completed','cancelled']).default('draft').notNull(),
	image: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

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
	index("categories_slug_unique").on(table.slug),
]);

export const cotisations = mysqlTable("cotisations", {
	id: int().autoincrement().notNull(),
	memberId: int().notNull(),
	montant: varchar({ length: 20 }).notNull(),
	dateDebut: timestamp({ mode: 'string' }).notNull(),
	dateFin: timestamp({ mode: 'string' }).notNull(),
	statut: mysqlEnum(['payée','en attente','en retard']).default('en attente').notNull(),
	datePayment: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const crmActivities = mysqlTable("crm_activities", {
	id: int().autoincrement().notNull(),
	contactId: int().notNull(),
	type: mysqlEnum(['call','email','meeting','task','note','event']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['pending','completed','cancelled']).default('pending').notNull(),
	priority: mysqlEnum(['low','medium','high']).default('medium').notNull(),
	dueDate: timestamp({ mode: 'string' }),
	completedDate: timestamp({ mode: 'string' }),
	assignedTo: int(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const crmContacts = mysqlTable("crm_contacts", {
	id: int().autoincrement().notNull(),
	userId: int(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 320 }).notNull(),
	phone: varchar({ length: 20 }),
	company: varchar({ length: 255 }),
	position: varchar({ length: 100 }),
	address: text(),
	city: varchar({ length: 100 }),
	postalCode: varchar({ length: 20 }),
	country: varchar({ length: 100 }),
	birthDate: date({ mode: 'string' }),
	joinDate: date({ mode: 'string' }),
	segment: varchar({ length: 50 }).default('general'),
	status: mysqlEnum(['prospect','active','inactive','archived']).default('prospect').notNull(),
	notes: text(),
	tags: varchar({ length: 500 }),
	lastInteraction: timestamp({ mode: 'string' }),
	engagementScore: int().default(0),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const crmEmailIntegration = mysqlTable("crm_email_integration", {
	id: int().autoincrement().notNull(),
	contactId: int().notNull(),
	emailHistoryId: int(),
	subject: varchar({ length: 255 }).notNull(),
	content: text(),
	direction: mysqlEnum(['sent','received']).notNull(),
	status: mysqlEnum(['sent','failed','bounced','opened','clicked']).default('sent').notNull(),
	sentBy: int(),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const crmReports = mysqlTable("crm_reports", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: mysqlEnum(['engagement','pipeline','activity','segment','custom']).notNull(),
	description: text(),
	data: json(),
	filters: json(),
	generatedBy: int().notNull(),
	generatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const depenses = mysqlTable("depenses", {
	id: int().autoincrement().notNull(),
	description: varchar({ length: 255 }).notNull(),
	montant: varchar({ length: 20 }).notNull(),
	categorie: varchar({ length: 100 }).notNull(),
	date: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	approuvePar: int(),
	notes: text(),
	pieceJointe: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const documentNotes = mysqlTable("document_notes", {
	id: int().autoincrement().notNull(),
	documentId: int().notNull(),
	userId: int().notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const documentPermissions = mysqlTable("document_permissions", {
	id: int().autoincrement().notNull(),
	documentId: int().notNull(),
	memberId: int().notNull(),
	canView: int().default(1),
	canEdit: int().default(0),
	canDelete: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

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
	isArchived: int().default(0),
});

export const dons = mysqlTable("dons", {
	id: int().autoincrement().notNull(),
	donateur: varchar({ length: 255 }).notNull(),
	montant: varchar({ length: 20 }).notNull(),
	description: text(),
	email: varchar({ length: 320 }),
	telephone: varchar({ length: 20 }),
	date: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const emailHistory = mysqlTable("email_history", {
	id: int().autoincrement().notNull(),
	templateId: int(),
	subject: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	recipientCount: int().notNull(),
	sentBy: int().notNull(),
	status: mysqlEnum(['pending','sending','sent','failed']).default('pending').notNull(),
	successCount: int().default(0),
	failureCount: int().default(0),
	errorMessage: text(),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const emailRecipients = mysqlTable("email_recipients", {
	id: int().autoincrement().notNull(),
	emailHistoryId: int().notNull(),
	recipientId: int().notNull(),
	recipientEmail: varchar({ length: 320 }).notNull(),
	status: mysqlEnum(['pending','sent','failed','bounced']).default('pending').notNull(),
	errorMessage: text(),
	sentAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const emailTemplates = mysqlTable("email_templates", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	description: text(),
	category: varchar({ length: 50 }).default('general'),
	variables: text(),
	isSystem: int().default(0),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const events = mysqlTable("events", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	location: varchar({ length: 255 }),
	eventType: mysqlEnum(['reunion','formation','activite','evenement','autre']).default('autre').notNull(),
	startDate: timestamp({ mode: 'string' }).notNull(),
	endDate: timestamp({ mode: 'string' }).notNull(),
	color: varchar({ length: 7 }).default('#1a4d2e'),
	organizer: varchar({ length: 255 }),
	attendees: int().default(0),
	image: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

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
});

// ... (autres anciennes tables conservées)

// ============================================================================
// NOUVELLES TABLES (POUR LA ROBUSTESSE)
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
]);

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
]);

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	type: mysqlEnum(['info','warning','error','success']).default('info').notNull(),
	isRead: int().default(0),
	actionUrl: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const passwordResetRequests = mysqlTable("password_reset_requests", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 320 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	temporaryPassword: varchar({ length: 255 }),
	status: mysqlEnum(['pending','completed','expired']).default('pending').notNull(),
	expiresAt: timestamp({ mode: 'string' }).notNull(),
	completedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("password_reset_requests_token_unique").on(table.token),
]);

export const members = mysqlTable("members", {
	id: int().autoincrement().notNull(),
	userId: int(),
	firstName: varchar({ length: 100 }).notNull(),
	lastName: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 20 }),
	role: varchar({ length: 100 }).default('Membre'),
	function: varchar({ length: 100 }),
	status: mysqlEnum(['active','inactive','pending']).default('active').notNull(),
	joinedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	memberRole: mysqlEnum(['admin','secretary','member']).default('member').notNull(),
	gender: mysqlEnum(['1','2','3']),
	memberId: varchar({ length: 20 }),
	photo: text(),
});

export const roles = mysqlTable("roles", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isSystem: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("roles_name_unique").on(table.name),
]);
