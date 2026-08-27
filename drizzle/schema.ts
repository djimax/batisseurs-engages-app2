import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, varchar, text, timestamp, mysqlEnum, date, index, uniqueIndex, json, tinyint } from "drizzle-orm/mysql-core"
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

export const assemblies = mysqlTable("assemblies", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	type: mysqlEnum(['ordinary','extraordinary']).default('ordinary').notNull(),
	status: mysqlEnum(['draft','scheduled','open','closed','archived']).default('draft').notNull(),
	scheduledAt: timestamp({ mode: 'string' }),
	opensAt: timestamp({ mode: 'string' }),
	closesAt: timestamp({ mode: 'string' }),
	quorumPercentage: int().default(50).notNull(),
	minutes: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("assemblies_status_idx").on(table.status),
	index("assemblies_scheduled_idx").on(table.scheduledAt),
]);

export const assemblyParticipants = mysqlTable("assembly_participants", {
	id: int().autoincrement().notNull(),
	assemblyId: int().notNull(),
	memberId: int().notNull(),
	attendance: mysqlEnum(['invited','present','absent','represented']).default('invited').notNull(),
	checkedInAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	uniqueIndex("assembly_participant_unique").on(table.assemblyId, table.memberId),
	index("assembly_participants_member_idx").on(table.memberId),
]);

export const assemblyProxies = mysqlTable("assembly_proxies", {
	id: int().autoincrement().notNull(),
	assemblyId: int().notNull(),
	representedMemberId: int().notNull(),
	proxyMemberId: int().notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	uniqueIndex("assembly_proxy_unique").on(table.assemblyId, table.representedMemberId),
	index("assembly_proxies_proxy_member_idx").on(table.proxyMemberId),
]);

export const assemblyResolutions = mysqlTable("assembly_resolutions", {
	id: int().autoincrement().notNull(),
	assemblyId: int().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	orderIndex: int().default(0).notNull(),
	status: mysqlEnum(['draft','open','closed']).default('draft').notNull(),
	closedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("assembly_resolutions_assembly_idx").on(table.assemblyId),
]);

export const assemblyVotes = mysqlTable("assembly_votes", {
	id: int().autoincrement().notNull(),
	resolutionId: int().notNull(),
	memberId: int().notNull(),
	choice: mysqlEnum(['for','against','abstain']).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	uniqueIndex("assembly_vote_unique").on(table.resolutionId, table.memberId),
	index("assembly_votes_member_idx").on(table.memberId),
]);

export const announcements = mysqlTable("announcements", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	category: varchar({ length: 100 }).default('general').notNull(),
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
	currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
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
	currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
	categorie: varchar({ length: 100 }).notNull(),
	date: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	approuvePar: int(),
	notes: text(),
	pieceJointe: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const suppliers = mysqlTable("suppliers", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 50 }),
	address: text(),
	taxId: varchar({ length: 100 }),
	status: mysqlEnum(['active', 'inactive']).default('active').notNull(),
	notes: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const purchaseRequests = mysqlTable("purchase_requests", {
	id: int().autoincrement().notNull(),
	supplierId: int(),
	projectId: int(),
	requestedBy: int().notNull(),
	description: varchar({ length: 500 }).notNull(),
	category: varchar({ length: 100 }).notNull(),
	amount: varchar({ length: 20 }).notNull(),
	currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
	status: mysqlEnum(['draft', 'submitted', 'approved', 'rejected', 'ordered', 'received', 'paid', 'cancelled']).default('draft').notNull(),
	neededBy: timestamp({ mode: 'string' }),
	justification: text(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	expenseId: int(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const purchaseQuotes = mysqlTable("purchase_quotes", {
	id: int().autoincrement().notNull(),
	purchaseRequestId: int().notNull(),
	supplierId: int().notNull(),
	quoteNumber: varchar({ length: 100 }),
	amount: varchar({ length: 20 }).notNull(),
	currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
	documentUrl: text(),
	validUntil: timestamp({ mode: 'string' }),
	status: mysqlEnum(['pending', 'selected', 'rejected']).default('pending').notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
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
	approvalStatus: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	approvalComment: text(),
	reviewerId: int(),
	reviewDueDate: timestamp({ mode: 'string' }),
	isArchived: int().default(0),
	fiscalYear: int(),
	antenneId: int(),
	projectId: int(),
	funder: varchar({ length: 255 }),
	confidentiality: mysqlEnum(['internal','restricted','confidential']).default('internal').notNull(),
	businessOwnerId: int(),
	contentIndex: text(),
});

export const documentSavedViews = mysqlTable("document_saved_views", {
  id: int().autoincrement().notNull(),
  userId: int().notNull(),
  name: varchar({ length: 120 }).notNull(),
  filters: text().notNull(),
  isDefault: int().default(0).notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("document_saved_views_user_idx").on(table.userId),
]);

export const documentVersions = mysqlTable("document_versions", {
  id: int().primaryKey().autoincrement().notNull(),
  documentId: int().notNull(),
  versionNumber: int().notNull(),
  fileUrl: text().notNull(),
  fileKey: varchar({ length: 500 }).notNull(),
  fileName: varchar({ length: 255 }).notNull(),
  fileType: varchar({ length: 100 }).notNull(),
  fileSize: int().notNull(),
  contentHash: varchar({ length: 128 }).notNull(),
  uploadedBy: int().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  documentIdx: index("document_versions_document_idx").on(table.documentId),
  documentVersionIdx: index("document_versions_document_version_idx").on(table.documentId, table.versionNumber),
}));

export const signatureRequests = mysqlTable("signature_requests", {
  id: int().autoincrement().notNull(),
  documentId: int().notNull(),
  createdBy: int().notNull(),
  subject: varchar({ length: 255 }).notNull(),
  documentHash: varchar({ length: 128 }).notNull(),
  status: mysqlEnum(['pending','partially-signed','completed','cancelled','expired']).default('pending').notNull(),
  expiresAt: timestamp({ mode: 'string' }),
  completedAt: timestamp({ mode: 'string' }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  documentIdx: index("signature_requests_document_idx").on(table.documentId),
  statusIdx: index("signature_requests_status_idx").on(table.status),
}));

export const signatureSigners = mysqlTable("signature_signers", {
  id: int().autoincrement().notNull(),
  requestId: int().notNull(),
  memberId: int().notNull(),
  signerName: varchar({ length: 255 }).notNull(),
  signerEmail: varchar({ length: 320 }).notNull(),
  orderIndex: int().default(0).notNull(),
  status: mysqlEnum(['pending','signed','declined']).default('pending').notNull(),
  typedSignature: varchar({ length: 255 }),
  signedAt: timestamp({ mode: 'string' }),
  consentAt: timestamp({ mode: 'string' }),
  evidenceHash: varchar({ length: 128 }),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  requestIdx: index("signature_signers_request_idx").on(table.requestId),
  memberIdx: index("signature_signers_member_idx").on(table.memberId),
}));

export const dons = mysqlTable("dons", {
	id: int().autoincrement().notNull(),
	donateur: varchar({ length: 255 }).notNull(),
	montant: varchar({ length: 20 }).notNull(),
	currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
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
	status: mysqlEnum(['active','inactive','pending','suspended','resigned','deceased','archived']).notNull(),
	reason: text(),
	changedBy: int(),
	changedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const antennes = mysqlTable("antennes", {
  id: int().autoincrement().notNull(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull(),
  description: text(),
  city: varchar({ length: 100 }).notNull(),
  address: text(),
  phone: varchar({ length: 20 }),
  email: varchar({ length: 320 }),
  responsibleId: int(),
  status: mysqlEnum(['active','inactive','archived']).default('active').notNull(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("antennes_slug_idx").on(table.slug),
  index("antennes_city_idx").on(table.city),
  index("antennes_responsible_idx").on(table.responsibleId),
]);

export const groupes = mysqlTable("groupes", {
  id: int().autoincrement().notNull(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull(),
  description: text(),
  antenneId: int(),
  responsibleId: int(),
  status: mysqlEnum(['active','inactive','archived']).default('active').notNull(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("groupes_slug_idx").on(table.slug),
  index("groupes_antenne_idx").on(table.antenneId),
  index("groupes_responsible_idx").on(table.responsibleId),
]);

export const groupeMembers = mysqlTable("groupe_members", {
  id: int().autoincrement().notNull(),
  groupeId: int().notNull(),
  memberId: int().notNull(),
  role: mysqlEnum(['leader','coordinator','member']).default('member').notNull(),
  joinedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
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
	status: mysqlEnum(['active','inactive','pending','suspended','resigned','deceased','archived']).default('active').notNull(),
	joinedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	memberRole: mysqlEnum(['admin','secretary','member']).default('member').notNull(),
	gender: mysqlEnum(['1','2','3']),
		memberId: varchar({ length: 20 }),
		photo: text(),
		membershipCategory: mysqlEnum(['standard','etudiant','bienfaiteur','fondateur','actif','honoraire']).default('standard').notNull(),
		skills: text(),
		availability: varchar({ length: 100 }),
		});

		export const membershipFeeRules = mysqlTable("membership_fee_rules", {
			id: int().autoincrement().notNull(),
			category: mysqlEnum(['standard','etudiant','bienfaiteur','fondateur','actif','honoraire']).notNull(),
			currency: mysqlEnum(['EUR', 'XOF']).notNull(),
			amount: varchar({ length: 20 }).notNull(),
			isActive: int().default(1).notNull(),
			validFrom: date({ mode: 'string' }).notNull(),
			createdBy: int(),
			createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
			updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
		}, (table) => [
			index("membership_fee_rules_category_idx").on(table.category),
			index("membership_fee_rules_currency_idx").on(table.currency),
		]);

		export const memberStatusHistory = mysqlTable("member_status_history", {
		id: int().autoincrement().notNull(),
		memberId: int().notNull(),
		previousStatus: varchar({ length: 50 }),
		newStatus: varchar({ length: 50 }).notNull(),
		reason: text().notNull(),
		changedBy: int(),
		createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	}, (table) => [
		index("member_status_history_member_idx").on(table.memberId),
	]);

	export const memberCertificates = mysqlTable("member_certificates", {
		id: int().autoincrement().notNull(),
		memberId: int().notNull(),
		certificateType: mysqlEnum(['membership_card','tax_receipt','attestation']).notNull(),
		referenceNumber: varchar({ length: 100 }).notNull(),
		issuedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
		pdfUrl: text(),
		createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	}, (table) => [
		index("member_certificates_member_idx").on(table.memberId),
	]);

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
	eventKey: varchar({ length: 100 }),
	entityType: varchar({ length: 80 }),
	entityId: int(),
	dedupeKey: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("notifications_user_idx").on(table.userId),
	index("notifications_read_idx").on(table.userId, table.isRead),
	uniqueIndex("notifications_dedupe_unique").on(table.dedupeKey),
]);

export const notificationPreferences = mysqlTable("notification_preferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	inAppEnabled: int().default(1).notNull(),
	emailEnabled: int().default(1).notNull(),
	typePreferences: json(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	uniqueIndex("notification_preferences_user_unique").on(table.userId),
]);

export const notificationSchedules = mysqlTable("notification_schedules", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 120 }).notNull(),
	scheduleCronTaskUid: varchar({ length: 65 }),
	cronExpression: varchar({ length: 32 }).notNull(),
	isEnabled: int().default(1).notNull(),
	lastRunAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	uniqueIndex("notification_schedules_name_unique").on(table.name),
	uniqueIndex("notification_schedules_task_uid_unique").on(table.scheduleCronTaskUid),
]);

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

export const projectTaskComments = mysqlTable("project_task_comments", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	projectId: int().notNull(),
	authorId: int().notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("project_task_comments_task_idx").on(table.taskId),
	index("project_task_comments_project_idx").on(table.projectId),
]);

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

	export const stripePayments = mysqlTable("stripe_payments", {
	id: int().autoincrement().notNull(),
	paymentType: mysqlEnum(['cotisation','don','campagne']).notNull(),
	memberId: int(),
	cotisationId: int(),
	donationId: int(),
	campaignId: int(),
	stripeCheckoutSessionId: varchar({ length: 255 }).notNull(),
	stripePaymentIntentId: varchar({ length: 255 }),
	status: mysqlEnum(['created','completed','failed','refunded']).default('created').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
	(table) => [
		uniqueIndex("stripe_payments_checkout_session_unique").on(table.stripeCheckoutSessionId),
		uniqueIndex("stripe_payments_payment_intent_unique").on(table.stripePaymentIntentId),
		index("stripe_payments_member_idx").on(table.memberId),
		index("stripe_payments_campaign_idx").on(table.campaignId),
	]
);

export const stripeEvents = mysqlTable("stripe_events", {
	id: int().autoincrement().notNull(),
	stripeEventId: varchar({ length: 255 }).notNull(),
	eventType: varchar({ length: 120 }).notNull(),
	status: mysqlEnum(['received','processed','failed']).default('received').notNull(),
	receivedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	processedAt: timestamp({ mode: 'string' }),
},
	(table) => [
		uniqueIndex("stripe_events_event_id_unique").on(table.stripeEventId),
	]
);

export const transactions = mysqlTable("transactions", {
		id: int().autoincrement().notNull(),
		type: mysqlEnum(['cotisation','don','depense','autre']).notNull(),
		montant: varchar({ length: 20 }).notNull(),
		currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
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

export const userScopes = mysqlTable("user_scopes", {
  id: int().autoincrement().notNull(),
  userId: int().notNull(),
  scopeType: mysqlEnum(['national','antenne','groupe','project']).notNull(),
  scopeId: int(),
  accessLevel: mysqlEnum(['viewer','editor','manager']).default('viewer').notNull(),
  assignedBy: int(),
  createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
  index("user_scopes_user_idx").on(table.userId),
  index("user_scopes_scope_idx").on(table.scopeType, table.scopeId),
]);

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



export const financialExpenses = mysqlTable("financial_expenses", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	amount: varchar({ length: 20 }).notNull(),
	currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
	category: varchar({ length: 100 }).notNull(),
	projectId: int(),
	antenneId: int(),
	expenseDate: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['pending', 'approved', 'rejected', 'reimbursed']).default('pending').notNull(),
	receiptUrl: text(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const taxReceipts = mysqlTable("tax_receipts", {
	id: int().autoincrement().notNull(),
	receiptNumber: varchar({ length: 100 }).notNull(),
	documentType: mysqlEnum(['tax_receipt','donation_certificate']).default('tax_receipt').notNull(),
	donorName: varchar({ length: 255 }).notNull(),
	donorEmail: varchar({ length: 320 }),
	amount: varchar({ length: 20 }).notNull(),
	currency: mysqlEnum(['EUR', 'XOF']).default('EUR').notNull(),
	donationDate: timestamp({ mode: 'string' }).notNull(),
	pdfUrl: text(),
	issuedBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	uniqueIndex("tax_receipts_number_unique").on(table.receiptNumber),
]);

export const associationDecisions = mysqlTable("association_decisions", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	referenceNumber: varchar({ length: 100 }).notNull(),
	content: text().notNull(),
	decisionDate: timestamp({ mode: 'string' }).notNull(),
	signedBy: varchar({ length: 255 }).notNull(),
	status: mysqlEnum(['draft', 'active', 'archived']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	uniqueIndex("association_decisions_ref_unique").on(table.referenceNumber),
]);


export const memberEvaluations = mysqlTable("member_evaluations", {
	id: int().autoincrement().notNull(),
	memberId: int().notNull(),
	evaluatorId: int().notNull(),
	score: int().notNull(), // Note sur 20 ou 100
	gradeProposed: varchar({ length: 100 }).notNull(), // ex: "Membre Actif", "Chef d'Antenne", "Référent Régional", "Administrateur"
	responsibilitiesAssigned: text(), // Responsabilités proposées ou conférées
	comments: text().notNull(), // Justification et observations qualitatives
	evaluatedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("member_evaluations_member_idx").on(table.memberId),
]);

export const memberGrades = mysqlTable("member_grades", {
	id: int().autoincrement().notNull(),
	memberId: int().notNull().unique(),
	currentGrade: varchar({ length: 100 }).default("Membre Adhérent").notNull(),
	currentResponsibilities: text(),
	lastEvaluationId: int(),
	promotedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});
