import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, text, timestamp, mysqlEnum, date, index, json, tinyint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

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
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	applicationDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
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
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	birthDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
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

export const memberHistory = mysqlTable("member_history", {
	id: int().autoincrement().notNull(),
	memberId: int().notNull(),
	fieldName: varchar({ length: 100 }).notNull(),
	oldValue: text(),
	newValue: text(),
	changedBy: int(),
	changedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const memberStatuses = mysqlTable("member_statuses", {
	id: int().autoincrement().notNull(),
	memberId: int().notNull(),
	status: mysqlEnum(['active','inactive','suspended','resigned','deceased']).notNull(),
	reason: text(),
	changedBy: int(),
	changedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

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

export const news = mysqlTable("news", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	excerpt: varchar({ length: 500 }),
	authorId: int().notNull(),
	category: varchar({ length: 100 }).default('general'),
	status: mysqlEnum(['draft','published','archived']).default('draft').notNull(),
	publishedAt: timestamp({ mode: 'string' }),
	viewCount: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const newsComments = mysqlTable("news_comments", {
	id: int().autoincrement().notNull(),
	newsId: int().notNull(),
	authorId: int().notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

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

export const permissions = mysqlTable("permissions", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("permissions_name_unique").on(table.name),
]);

export const projectBudgetItems = mysqlTable("project_budget_items", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	category: varchar({ length: 100 }).notNull(),
	amount: varchar({ length: 20 }).notNull(),
	spent: varchar({ length: 20 }).default('0').notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const projectMembers = mysqlTable("project_members", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	memberId: int().notNull(),
	role: mysqlEnum(['project-lead','member','observer']).default('member').notNull(),
	joinedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const projectMilestones = mysqlTable("project_milestones", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['pending','in-progress','completed','delayed']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const projectTasks = mysqlTable("project_tasks", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['todo','in-progress','in-review','completed']).default('todo').notNull(),
	priority: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	assignedTo: int(),
	dueDate: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const projectUpdates = mysqlTable("project_updates", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const projects = mysqlTable("projects", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['planning','in-progress','on-hold','completed','archived']).default('planning').notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	budget: varchar({ length: 20 }),
	leaderId: int().notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const rolePermissions = mysqlTable("role_permissions", {
	id: int().autoincrement().notNull(),
	roleId: int().notNull(),
	permissionId: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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

export const transactions = mysqlTable("transactions", {
	id: int().autoincrement().notNull(),
	type: mysqlEnum(['cotisation','don','depense','autre']).notNull(),
	montant: varchar({ length: 20 }).notNull(),
	description: varchar({ length: 255 }).notNull(),
	date: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	memberId: int(),
	referenceId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const userRoles = mysqlTable("user_roles", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	roleId: int().notNull(),
	assignedBy: int(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);
