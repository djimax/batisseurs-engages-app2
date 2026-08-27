import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { emailRouter } from "./email-router";
import { adminSettingsRouter } from "./admin-settings-router";
import { crmRouter } from "./crm-router";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { 
  getAllCategories, getCategoryById, createCategory, seedDefaultCategories,
  getAllDocuments, getDocumentById, createDocument, updateDocument, deleteDocument, getDocumentStats, seedDefaultDocuments, getDocumentVersions, createDocumentVersion, getDocumentPermissions, setDocumentPermission, removeDocumentPermission, getDocumentPermissionForUser, getAccessibleDocumentIds, getDocumentSavedViews, createDocumentSavedView, deleteDocumentSavedView,
  getNotesByDocumentId, getNoteById, createNote, deleteNote,
  getAllMembers, getAllMembersWithGrades, getMemberById, createMember, updateMember, deleteMember,
  logActivity, getRecentActivity,
  createCotisation, getCotisations, getCotisationsByMember, updateCotisation,
  getMembershipFeeRules, getActiveMembershipFeeRule, createMembershipFeeRule,
  createDon, getDons,
  createDepense, getDepenses,
  createTransaction, getTransactions,
  getFinancialStats,
  getGlobalSettings, updateGlobalSettings, initializeGlobalSettings,
  getDb,
  createProject, getProject, listProjects, updateProject, deleteProject,
  addProjectMember, getProjectMembers, removeProjectMember,
  createProjectTask, getProjectTasks, updateProjectTask, deleteProjectTask,
  createProjectMilestone, getProjectMilestones, updateProjectMilestone, deleteProjectMilestone,
  createProjectUpdate, getProjectUpdates,
  createProjectTaskComment, getProjectTaskComments, deleteProjectTaskComment, getProjectReport,
  getProjectBudgetItems, createProjectBudgetItem, updateProjectBudgetItem, deleteProjectBudgetItem,
  getDashboardStatistics, getGlobalDashboardSummary, getProjectsStatistics, getTasksStatistics, getFinanceStatistics, getMembersStatistics, getSignatureDeliveryDashboard,
  createMemberCertificate, getMemberCertificates,
  getAllUsers, getUserById, updateUserRole, getAdminCount, isUserAdmin,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getNewsList, createNews, updateNews, deleteNews, getNewsComments, addNewsComment, deleteNewsComment,
  createMemberEvaluation, getMemberEvaluations, getMemberGrade
} from "./db";
import { roles, permissions, rolePermissions, userRoles, userScopes, auditLogs, emailTemplates, emailHistory, emailRecipients, members, adhesions, notificationSchedules, announcements, news, newsComments, projects, projectMembers, groupes, groupeMembers, antennes } from "../drizzle/schema";
import { buildMemberCardPayload, getMemberHistory, getMemberStatusHistory, memberStatusSchema, recordMemberHistory, recordMemberStatus } from "./member-lifecycle";
import { createUserNotification, generateMembershipReminderNotifications, getOrCreateNotificationPreferences, listUserNotifications, markAllNotificationsRead, markNotificationRead, updateNotificationPreferences } from "./notification-center";
import { and, eq, desc } from "drizzle-orm";
import { parse as parseCookieHeader } from "cookie";
import { createHeartbeatJob } from "./_core/heartbeat";
import { logAudit } from "./audit";
import { assertPermission, ensureDefaultPermissions } from "./authorization";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import { createHash } from "node:crypto";
import { membersAdhesionsRouter } from "./members-adhesions-router";
import { buildDonationDocumentHtml, convertFinancialAmount, createTaxReceipt, FINANCIAL_CURRENCIES, formatFinancialAmount, listTaxReceipts, parseFinancialAmount } from "./financial";
import { antennasRouter, groupesRouter } from "./antennes-groupes-router";
import { canAssignMemberGrade, MEMBER_GRADE_LEVELS } from "../shared/memberProgression";
import { governanceRouter } from "./governance-router";
import { stripeRouter } from "./stripe-router";
import { campaignsRouter } from "./campaigns-router";
import { eventsRouter } from "./events-router";
import { signatureRouter } from "./signature-router";
import { purchasesRouter } from "./purchases-router";

// Note: Email procedures are now in email-router.ts and imported above

async function assertDocumentCapability(user: { id: number; role?: string | null }, documentId: number, capability: "canView" | "canEdit" | "canDelete") {
  if (user.role === "admin") return;
  const permission = await getDocumentPermissionForUser(documentId, user.id);
  if (!permission || permission[capability] !== 1) throw new TRPCError({ code: "FORBIDDEN", message: "Vous n’avez pas accès à cette opération sur ce document." });
}

export const appRouter = router({
  system: systemRouter,
  email: emailRouter,
  adminSettings: adminSettingsRouter,
  crm: crmRouter,
  membersAdhesions: membersAdhesionsRouter,
  antennes: antennasRouter,
  groupes: groupesRouter,
  governance: governanceRouter,
  stripe: stripeRouter,
  campaigns: campaignsRouter,
  events: eventsRouter,
  signature: signatureRouter,
  purchases: purchasesRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ CATEGORIES ============
  categories: router({
    list: publicProcedure.query(async () => {
      await seedDefaultCategories();
      return getAllCategories();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getCategoryById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createCategory(input);
        await logActivity({
          userId: ctx.user.id,
          action: "create",
          entityType: "category",
          entityId: result.id as number,
          details: `Catégorie "${input.name}" créée`,
        });
        return result;
      }),
  }),

  // ============ DOCUMENTS ============
  documents: router({
    list: protectedProcedure
      .input(z.object({
        categoryId: z.number().int().positive().optional(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        search: z.string().trim().max(200).optional(),
        isArchived: z.boolean().optional(),
        retentionFilter: z.enum(["legal-hold", "active"]).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        await seedDefaultCategories();
        await seedDefaultDocuments();
        const allDocuments = await getAllDocuments({
          ...input,
          isArchived: input?.isArchived ? 1 : input?.isArchived === false ? 0 : undefined,
          retentionFilter: input?.retentionFilter,
        });
        if (ctx.user.role === "admin") return allDocuments;
        const accessibleIds = await getAccessibleDocumentIds(ctx.user.id, "canView");
        return allDocuments.filter((document) => accessibleIds.includes(document.id));
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
            .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        await assertDocumentCapability(ctx.user, input.id, "canView");
        return getDocumentById(input.id);
      }),
    versions: protectedProcedure
      .input(z.object({ documentId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        await assertDocumentCapability(ctx.user, input.documentId, "canView");
        return getDocumentVersions(input.documentId);
      }),
    permissions: protectedProcedure
      .input(z.object({ documentId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        await assertDocumentCapability(ctx.user, input.documentId, "canView");
        return getDocumentPermissions(input.documentId);
      }),
    share: protectedProcedure
      .input(z.object({ documentId: z.number().int().positive(), memberId: z.number().int().positive(), canView: z.boolean().default(true), canEdit: z.boolean().default(false), canDelete: z.boolean().default(false) }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        const document = await getDocumentById(input.documentId);
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        const member = await getMemberById(input.memberId);
        if (!member || member.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Le partage est réservé aux membres actifs" });
        const permission = await setDocumentPermission({ documentId: input.documentId, memberId: input.memberId, canView: input.canView ? 1 : 0, canEdit: input.canEdit ? 1 : 0, canDelete: input.canDelete ? 1 : 0 });
        await logAudit({ userId: ctx.user.id, action: "SHARE", entityType: "document", entityId: input.documentId, entityName: document.title, description: `Document partagé avec ${member.firstName} ${member.lastName}`, newValue: JSON.stringify({ memberId: input.memberId, canView: input.canView, canEdit: input.canEdit, canDelete: input.canDelete }), status: "success" });
        return permission;
      }),
    revokeShare: protectedProcedure
      .input(z.object({ documentId: z.number().int().positive(), memberId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        const document = await getDocumentById(input.documentId);
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        await removeDocumentPermission(input.documentId, input.memberId);
        await logAudit({ userId: ctx.user.id, action: "REVOKE_SHARE", entityType: "document", entityId: input.documentId, entityName: document.title, description: `Accès révoqué pour le membre ${input.memberId}`, status: "success" });
        return { success: true as const };
      }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "documents.view");
      await seedDefaultCategories();
      await seedDefaultDocuments();
      return getDocumentStats();
    }),
    bulkArchive: protectedProcedure
      .input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(100), archived: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        let updated = 0;
        const refused: number[] = [];
        for (const id of input.ids) {
          try {
            await assertDocumentCapability(ctx.user, id, "canEdit");
            const document = await getDocumentById(id);
            if (!document) { refused.push(id); continue; }
            await updateDocument(id, { isArchived: input.archived ? 1 : 0, updatedBy: ctx.user.id } as any);
            await logAudit({ userId: ctx.user.id, action: input.archived ? "ARCHIVE" : "RESTORE", entityType: "document", entityId: id, entityName: document.title, description: input.archived ? "Archivage groupé" : "Restauration groupée", status: "success" });
            updated += 1;
          } catch { refused.push(id); }
        }
        return { updated, refused };
      }),
    recordAccess: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), action: z.enum(["VIEW", "DOWNLOAD", "PRINT", "EXPORT"]) }))
      .mutation(async ({ input, ctx }) => {
        await assertDocumentCapability(ctx.user, input.id, "canView");
        const document = await getDocumentById(input.id);
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        await logAudit({ userId: ctx.user.id, action: input.action, entityType: "document", entityId: input.id, entityName: document.title, description: `Accès documentaire : ${input.action}`, status: "success" });
        return { success: true as const };
      }),
    accessLog: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertDocumentCapability(ctx.user, input.id, "canView");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        return db.select({
          id: auditLogs.id,
          action: auditLogs.action,
          userId: auditLogs.userId,
          userEmail: auditLogs.userEmail,
          description: auditLogs.description,
          status: auditLogs.status,
          errorMessage: auditLogs.errorMessage,
          createdAt: auditLogs.createdAt,
        }).from(auditLogs)
          .where(and(eq(auditLogs.entityType, "document"), eq(auditLogs.entityId, input.id)))
          .orderBy(desc(auditLogs.createdAt))
          .limit(100);
      }),
    savedViews: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "documents.view");
      return getDocumentSavedViews(ctx.user.id);
    }),
    saveView: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(120),
        filters: z.object({
          categoryId: z.number().int().positive().nullable().optional(),
          status: z.enum(["pending", "in-progress", "completed"]).nullable().optional(),
          priority: z.enum(["low", "medium", "high", "urgent"]).nullable().optional(),
          search: z.string().trim().max(200).nullable().optional(),
          isArchived: z.boolean().optional(),
          fiscalYear: z.number().int().min(2000).max(2200).nullable().optional(),
          confidentiality: z.enum(["internal", "restricted", "confidential"]).nullable().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        const view = await createDocumentSavedView({ userId: ctx.user.id, name: input.name, filters: JSON.stringify(input.filters), isDefault: 0 });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "document_saved_view", entityId: view?.id, entityName: input.name, description: "Vue documentaire enregistrée", newValue: JSON.stringify(input.filters), status: "success" });
        return view;
      }),
    deleteSavedView: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        await deleteDocumentSavedView(input.id, ctx.user.id);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "document_saved_view", entityId: input.id, description: "Vue documentaire supprimée", status: "success" });
        return { success: true as const };
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number().int().positive(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.date().optional(),
        fiscalYear: z.number().int().min(2000).max(2200).nullable().optional(),
        antenneId: z.number().int().positive().nullable().optional(),
        projectId: z.number().int().positive().nullable().optional(),
        funder: z.string().trim().max(255).nullable().optional(),
        confidentiality: z.enum(["internal", "restricted", "confidential"]).optional(),
        businessOwnerId: z.number().int().positive().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        const result = await createDocument({
          ...input,
          dueDate: input.dueDate ? input.dueDate.toISOString() : undefined,
          fiscalYear: input.fiscalYear ?? null,
          antenneId: input.antenneId ?? null,
          projectId: input.projectId ?? null,
          funder: input.funder ?? null,
          confidentiality: input.confidentiality ?? "internal",
          businessOwnerId: input.businessOwnerId ?? null,
          createdBy: ctx.user.id,
        } as any);
        await logActivity({
          userId: ctx.user.id,
          action: "create",
          entityType: "document",
          entityId: result.id as number,
          details: `Document "${input.title}" créé`,
        });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "document", entityId: result.id as number, entityName: input.title, description: `Document "${input.title}" créé`, newValue: JSON.stringify({ categoryId: input.categoryId, priority: input.priority ?? "medium", dueDate: input.dueDate?.toISOString() ?? null, fiscalYear: input.fiscalYear ?? null, antenneId: input.antenneId ?? null, projectId: input.projectId ?? null, funder: input.funder ?? null, confidentiality: input.confidentiality ?? "internal", businessOwnerId: input.businessOwnerId ?? null }), status: "success" });
        await notifyOwner({
          title: "Nouveau document créé",
          content: `Le document "${input.title}" a été créé par ${ctx.user.name || "un utilisateur"}.`,
        });
        return result;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(1).max(255).optional(),
        description: z.string().trim().max(5000).optional(),
        categoryId: z.number().int().positive().optional(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.date().nullable().optional(),
        isArchived: z.boolean().optional(),
        fiscalYear: z.number().int().min(2000).max(2200).nullable().optional(),
        antenneId: z.number().int().positive().nullable().optional(),
        projectId: z.number().int().positive().nullable().optional(),
        funder: z.string().trim().max(255).nullable().optional(),
        confidentiality: z.enum(["internal", "restricted", "confidential"]).optional(),
        businessOwnerId: z.number().int().positive().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.id, "canEdit");
        const { id, ...data } = input;
        const convertedData = {
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
          updatedBy: ctx.user.id,
        };
        const result = await updateDocument(id, convertedData as any);
        await logActivity({
          userId: ctx.user.id,
          action: "update",
          entityType: "document",
          entityId: id,
          details: `Document mis à jour`,
        });
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "document", entityId: id, description: "Document mis à jour", newValue: JSON.stringify({ ...data, dueDate: data.dueDate?.toISOString() ?? null, fiscalYear: data.fiscalYear ?? null, antenneId: data.antenneId ?? null, projectId: data.projectId ?? null, funder: data.funder ?? null, confidentiality: data.confidentiality ?? null, businessOwnerId: data.businessOwnerId ?? null }), status: "success" });
        return result;
      }),
    assignReview: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), reviewerId: z.number().int().positive().nullable(), reviewDueDate: z.date().nullable() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        const document = await getDocumentById(input.id);
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        await updateDocument(input.id, { reviewerId: input.reviewerId, reviewDueDate: input.reviewDueDate?.toISOString() ?? null, updatedBy: ctx.user.id } as any);
        await logAudit({ userId: ctx.user.id, action: "ASSIGN_REVIEW", entityType: "document", entityId: input.id, entityName: document.title, description: "Révision documentaire assignée", newValue: JSON.stringify({ reviewerId: input.reviewerId, reviewDueDate: input.reviewDueDate?.toISOString() ?? null }), status: "success" });
        return getDocumentById(input.id);
      }),
    submitReview: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), comment: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const document = await getDocumentById(input.id);
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        if (ctx.user.role !== "admin" && document.reviewerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Vous n’êtes pas le réviseur désigné." });
        await updateDocument(input.id, { approvalStatus: input.status, approvedBy: ctx.user.id, approvedAt: new Date().toISOString(), approvalComment: input.comment ?? null, updatedBy: ctx.user.id } as any);
        await logAudit({ userId: ctx.user.id, action: input.status === "approved" ? "REVIEW_APPROVE" : "REVIEW_REJECT", entityType: "document", entityId: input.id, entityName: document.title, description: "Décision de revue documentaire", newValue: JSON.stringify({ status: input.status, comment: input.comment ?? null }), status: "success" });
        return getDocumentById(input.id);
      }),
    approve: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["pending", "approved", "rejected"]),
        comment: z.string().trim().max(2000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        const existing = await getDocumentById(input.id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        const approved = input.status === "approved";
        await updateDocument(input.id, {
          approvalStatus: input.status,
          approvedBy: approved ? ctx.user.id : null,
          approvedAt: approved ? new Date().toISOString() : null,
          approvalComment: input.comment ?? null,
          updatedBy: ctx.user.id,
        } as any);
        await logAudit({
          userId: ctx.user.id,
          action: input.status === "approved" ? "APPROVE" : input.status === "rejected" ? "REJECT" : "RESET_APPROVAL",
          entityType: "document",
          entityId: input.id,
          entityName: existing.title,
          description: `Approbation documentaire : ${input.status}`,
          newValue: JSON.stringify({ approvalStatus: input.status, comment: input.comment ?? null }),
          status: "success",
        });
        return getDocumentById(input.id);
      }),
    
    setRetention: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), retentionUntil: z.number().int().positive().nullable(), legalHold: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.id, "canEdit");
        const document = await getDocumentById(input.id);
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        await updateDocument(input.id, { retentionUntil: input.retentionUntil, legalHold: input.legalHold, updatedBy: ctx.user.id } as any);
        await logAudit({ userId: ctx.user.id, action: "RETENTION_UPDATE", entityType: "document", entityId: input.id, entityName: document.title, description: "Politique de conservation mise à jour", newValue: JSON.stringify({ retentionUntil: input.retentionUntil, legalHold: input.legalHold }), status: "success" });
        return getDocumentById(input.id);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.id, "canDelete");
        const document = await getDocumentById(input.id);
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
        if (document.legalHold || (document.retentionUntil && document.retentionUntil > Date.now())) {
          throw new TRPCError({ code: "CONFLICT", message: "Ce document est protégé par une politique de conservation." });
        }
        await deleteDocument(input.id);
        await logActivity({
          userId: ctx.user.id,
          action: "delete",
          entityType: "document",
          entityId: input.id,
          details: `Document supprimé`,
        });
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "document", entityId: input.id, description: "Document supprimé", status: "success" });
        return { success: true };
      }),
    
    uploadFile: protectedProcedure
      .input(z.object({
        documentId: z.number().int().positive(),
        fileName: z.string().trim().min(1).max(255).refine(name => !name.includes("/") && !name.includes("\\") && !name.includes("\0"), "Nom de fichier invalide"),
        fileType: z.string().trim().min(1).max(150).refine(value => value.includes("/") && !value.includes(" "), "Type MIME invalide"),
        fileSize: z.number().int().positive().max(50 * 1024 * 1024),
        fileBase64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, "Contenu Base64 invalide").max(70 * 1024 * 1024),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.documentId, "canEdit");
        const { documentId, fileName, fileType, fileSize, fileBase64 } = input;
        
        // Convert base64 to buffer and reject forged size metadata
        const fileBuffer = Buffer.from(fileBase64, "base64");
        if (fileBuffer.length !== fileSize) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "La taille du fichier ne correspond pas à son contenu." });
        }
        
        const contentHash = createHash("sha256").update(fileBuffer).digest("hex");
        const previousVersions = await getDocumentVersions(documentId);
        if (previousVersions.some((version) => version.contentHash === contentHash)) {
          throw new TRPCError({ code: "CONFLICT", message: "Ce fichier est déjà présent dans l’historique du document." });
        }
        // Generate a safe, non-enumerable file key
        const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileKey = `documents/${documentId}/${nanoid()}-${safeFileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, fileBuffer, fileType);
        const versionNumber = (previousVersions[0]?.versionNumber ?? 0) + 1;
        await createDocumentVersion({ documentId, versionNumber, fileUrl: url, fileKey, fileName, fileType, fileSize, contentHash, uploadedBy: ctx.user.id });
        // Update document with file info

        const indexableTypes = new Set(["text/plain", "text/csv", "application/json", "text/markdown", "application/xml", "text/xml"]);
        const contentIndex = indexableTypes.has(fileType) ? fileBuffer.toString("utf8").slice(0, 500_000) : null;
        await updateDocument(documentId, {
          fileUrl: url,
          fileKey,
          fileName,
          fileType,
          fileSize,
          contentIndex,
          updatedBy: ctx.user.id,
        } as any);
        
                await logActivity({
          userId: ctx.user.id,
          action: "upload",
          entityType: "document",
          entityId: documentId,
          details: `Fichier "${fileName}" uploadé`,
        });
        await logAudit({ userId: ctx.user.id, action: "UPLOAD_VERSION", entityType: "document", entityId: documentId, entityName: fileName, description: `Version ${versionNumber} du fichier "${fileName}" enregistrée`, newValue: JSON.stringify({ versionNumber, contentHash, fileSize }), status: "success" });
        await notifyOwner({
          title: "Fichier uploadé",
          content: `Le fichier "${fileName}" a été uploadé par ${ctx.user.name || "un utilisateur"}.`,
        });
        
        return { success: true, url, fileKey };
      }),
    
    removeFile: protectedProcedure
      .input(z.object({ documentId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.documentId, "canEdit");
        await updateDocument(input.documentId, {
          fileUrl: null,
          fileKey: null,
          fileName: null,
          fileType: null,
          fileSize: null,
          updatedBy: ctx.user.id,
        });
        await logActivity({
          userId: ctx.user.id,
          action: "remove_file",
          entityType: "document",
          entityId: input.documentId,
          details: `Fichier supprimé du document`,
        });
        return { success: true };
      }),
    
    // Export documents report data
    exportReport: protectedProcedure
      .input(z.object({
        categoryId: z.number().int().positive().optional(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        const docs = await getAllDocuments(input);
        const cats = await getAllCategories();
        const stats = await getDocumentStats();
        
        const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
        
        const reportData = docs.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description || "",
          category: catMap[doc.categoryId] || "Non catégorisé",
          status: doc.status === "completed" ? "Complété" : doc.status === "in-progress" ? "En cours" : "En attente",
          priority: doc.priority === "urgent" ? "Urgent" : doc.priority === "high" ? "Haute" : doc.priority === "medium" ? "Moyenne" : "Basse",
          hasFile: !!doc.fileUrl,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));
        
        return {
          documents: reportData,
          stats,
          categories: cats,
          generatedAt: new Date(),
        };
      }),
    
    // List archived documents
    archived: protectedProcedure
      .input(z.object({
        categoryId: z.number().int().positive().optional(),
        search: z.string().trim().max(200).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        const archivedDocuments = await getAllDocuments({
          ...input,
          isArchived: 1,
        });
        if (ctx.user.role === "admin") return archivedDocuments;
        const accessibleIds = await getAccessibleDocumentIds(ctx.user.id, "canView");
        return archivedDocuments.filter((document) => accessibleIds.includes(document.id));
      }),
    
    // Archive a document
    archive: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.id, "canEdit");
        const result = await updateDocument(input.id, {
          isArchived: 1,
          updatedBy: ctx.user.id,
        });
        await logActivity({
          userId: ctx.user.id,
          action: "archive",
          entityType: "document",
          entityId: input.id,
          details: "Document archivé",
        });
        await logAudit({ userId: ctx.user.id, action: "ARCHIVE", entityType: "document", entityId: input.id, description: "Document archivé", newValue: JSON.stringify({ isArchived: 1 }), status: "success" });
        await notifyOwner({
          title: "Document archivé",
          content: `Le document a été archivé par ${ctx.user.name || "un utilisateur"}.`,
        });
        return result;
      }),
    
    // Restore an archived document
    restore: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.id, "canEdit");
        const result = await updateDocument(input.id, {
          isArchived: 0,
          updatedBy: ctx.user.id,
        });
        await logActivity({
          userId: ctx.user.id,
          action: "restore",
          entityType: "document",
          entityId: input.id,
          details: "Document restauré",
        });
        await logAudit({ userId: ctx.user.id, action: "RESTORE", entityType: "document", entityId: input.id, description: "Document restauré", newValue: JSON.stringify({ isArchived: 0 }), status: "success" });
        return result;
      }),
  }),

  // ============ NOTES ============
  notes: router({
    listByDocument: protectedProcedure
      .input(z.object({ documentId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.view");
        await assertDocumentCapability(ctx.user, input.documentId, "canView");
        return getNotesByDocumentId(input.documentId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        documentId: z.number().int().positive(),
        content: z.string().trim().min(1).max(5000),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        await assertDocumentCapability(ctx.user, input.documentId, "canEdit");
        const result = await createNote({
          documentId: input.documentId,
          userId: ctx.user.id,
          content: input.content,
        });
        await logActivity({
          userId: ctx.user.id,
          action: "create",
          entityType: "note",
          entityId: result.id as number,
          details: `Note ajoutée au document #${input.documentId}`,
        });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "document_comment", entityId: result.id as number, description: `Commentaire ajouté au document #${input.documentId}`, newValue: JSON.stringify({ documentId: input.documentId, contentLength: input.content.length }), status: "success" });
        return result;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "documents.manage");
        const note = await getNoteById(input.id);
        if (!note) throw new TRPCError({ code: "NOT_FOUND", message: "Note introuvable" });
        await assertDocumentCapability(ctx.user, note.documentId, "canEdit");
        await deleteNote(input.id);
        await logActivity({
          userId: ctx.user.id,
          action: "delete",
          entityType: "note",
          entityId: input.id,
          details: `Note supprimée`,
        });
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "document_comment", entityId: input.id, description: `Commentaire supprimé du document #${note.documentId}`, status: "success" });
        return { success: true };
      }),
  }),

  // ============ VOLUNTEERS COORDINATION ============
  volunteers: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        skill: z.string().optional(),
        availability: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        const db = await getDb();
        if (!db) return [];
        const allMembers = await getAllMembers();
        const filtered = allMembers.filter((m) => {
          if (m.status !== "active") return false;
          if (input?.availability && input.availability !== 'all' && (m as any).availability !== input.availability) {
            return false;
          }
          if (input?.skill && input.skill !== 'all') {
            const skills = ((m as any).skills || '').toLowerCase();
            if (!skills.includes(input.skill.toLowerCase())) return false;
          }
          if (input?.search) {
            const query = input.search.toLowerCase();
            const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
            const email = (m.email || '').toLowerCase();
            const skills = ((m as any).skills || '').toLowerCase();
            if (!fullName.includes(query) && !email.includes(query) && !skills.includes(query)) {
              return false;
            }
          }
          return true;
        });

        return Promise.all(filtered.map(async (member) => {
          const [projectAssignments, groupAssignments] = await Promise.all([
            db.select({
              id: projectMembers.id,
              projectId: projectMembers.projectId,
              role: projectMembers.role,
              joinedAt: projectMembers.joinedAt,
              projectName: projects.name,
            }).from(projectMembers).leftJoin(projects, eq(projectMembers.projectId, projects.id)).where(eq(projectMembers.memberId, member.id)),
            db.select({
              id: groupeMembers.id,
              groupeId: groupeMembers.groupeId,
              role: groupeMembers.role,
              joinedAt: groupeMembers.joinedAt,
              groupeName: groupes.name,
              antenneId: groupes.antenneId,
              antenneName: antennes.name,
            }).from(groupeMembers)
              .leftJoin(groupes, eq(groupeMembers.groupeId, groupes.id))
              .leftJoin(antennes, eq(groupes.antenneId, antennes.id))
              .where(eq(groupeMembers.memberId, member.id)),
          ]);

          return {
            ...member,
            assignments: {
              projects: projectAssignments,
              groups: groupAssignments,
            },
          };
        }));
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        skills: z.string().optional(),
        availability: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.edit");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const current = await getMemberById(input.memberId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });

        await db.update(members)
          .set({
            skills: input.skills,
            availability: input.availability,
            updatedAt: new Date().toISOString(),
          } as any)
          .where(eq(members.id, input.memberId));

        for (const [fieldName, newValue] of Object.entries({ skills: input.skills, availability: input.availability })) {
          if (newValue === undefined) continue;
          const oldValue = (current as Record<string, unknown>)[fieldName];
          if (String(oldValue ?? "") !== String(newValue ?? "")) {
            await recordMemberHistory({ memberId: input.memberId, fieldName, oldValue, newValue, changedBy: ctx.user.id });
          }
        }
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "member_profile", entityId: input.memberId, description: `Profil du membre #${input.memberId} mis à jour`, newValue: JSON.stringify({ skills: input.skills, availability: input.availability }), status: "success" });

        return { success: true };
      }),

    assignProject: protectedProcedure
      .input(z.object({
        memberId: z.number().int().positive(),
        projectId: z.number().int().positive().optional(),
        groupId: z.number().int().positive().optional(),
        projectRole: z.enum(["project-lead", "member", "observer"]).default("member"),
        groupRole: z.enum(["leader", "coordinator", "member"]).default("member"),
      }).refine((value) => Boolean(value.projectId) !== Boolean(value.groupId), {
        message: "Sélectionnez un projet ou un groupe d’antenne, mais pas les deux.",
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.edit");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });

        if (input.projectId) {
          const project = await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.id, input.projectId));
          if (!project[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Projet introuvable" });
          const existing = await db.select({ id: projectMembers.id }).from(projectMembers).where(and(eq(projectMembers.projectId, input.projectId), eq(projectMembers.memberId, input.memberId)));
          if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Le bénévole est déjà affecté à ce projet." });
          await db.insert(projectMembers).values({ projectId: input.projectId, memberId: input.memberId, role: input.projectRole });
          await logActivity({ userId: ctx.user.id, action: "assign", entityType: "volunteer_project", entityId: input.memberId, details: `Affectation au projet ${project[0].name}` });
          await logAudit({ userId: ctx.user.id, action: "ASSIGN", entityType: "volunteer_project", entityId: input.memberId, description: `Membre affecté au projet ${project[0].name}`, newValue: JSON.stringify({ projectId: input.projectId, role: input.projectRole }), status: "success" });
          return { success: true, scope: "project", name: project[0].name };
        }

        const group = await db.select({ id: groupes.id, name: groupes.name, antenneId: groupes.antenneId }).from(groupes).where(eq(groupes.id, input.groupId!));
        if (!group[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Groupe d’antenne introuvable" });
        const existing = await db.select({ id: groupeMembers.id }).from(groupeMembers).where(and(eq(groupeMembers.groupeId, input.groupId!), eq(groupeMembers.memberId, input.memberId)));
        if (existing[0]) throw new TRPCError({ code: "CONFLICT", message: "Le bénévole est déjà affecté à ce groupe." });
        await db.insert(groupeMembers).values({ groupeId: input.groupId!, memberId: input.memberId, role: input.groupRole });
        await logActivity({ userId: ctx.user.id, action: "assign", entityType: "volunteer_group", entityId: input.memberId, details: `Affectation au groupe d’antenne ${group[0].name}` });
        await logAudit({ userId: ctx.user.id, action: "ASSIGN", entityType: "volunteer_group", entityId: input.memberId, description: `Membre affecté au groupe ${group[0].name}`, newValue: JSON.stringify({ groupId: input.groupId, role: input.groupRole }), status: "success" });
        return { success: true, scope: "group", name: group[0].name };
      }),
  }),

  // ============ MEMBERS ============
  members: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "members.view");
      return getAllMembersWithGrades();
    }),

    directory: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
        sortBy: z.enum(['name_asc', 'name_desc', 'recent']).default('name_asc'),
      }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        const db = await getDb();
        if (!db) return [];

        const allMembers = await getAllMembers();
        const statusFilter = input?.status ?? 'active';
        const filtered = allMembers.filter((m) => {
          if (statusFilter !== 'all' && m.status !== statusFilter) return false;
          if (input?.category && input.category !== 'all' && (m as any).membershipCategory !== input.category) return false;
          if (input?.search) {
            const query = input.search.toLowerCase();
            const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
            const email = (m.email || '').toLowerCase();
            const memberId = (m.memberId || '').toLowerCase();
            const skills = ((m as any).skills || '').toLowerCase();
            if (!fullName.includes(query) && !email.includes(query) && !memberId.includes(query) && !skills.includes(query)) {
              return false;
            }
          }
          return true;
        });

        // Sort
        filtered.sort((a, b) => {
          if (input?.sortBy === 'name_desc') {
            return `${b.lastName} ${b.firstName}`.localeCompare(`${a.lastName} ${a.firstName}`);
          }
          if (input?.sortBy === 'recent') {
            return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
          }
          return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
        });

        // Attach recent contributions (e.g. cotisations, project tasks or activity logs)
        const enriched = await Promise.all(filtered.map(async (m) => {
          const [cotis, history, certs] = await Promise.all([
            getCotisationsByMember(m.id),
            getMemberHistory(m.id),
            getMemberCertificates(m.id),
          ]);
          const recentContributions = [
            ...cotis.map((cotisation) => ({
              type: 'cotisation' as const,
              label: `Cotisation ${cotisation.statut}`,
              date: cotisation.datePayment ?? cotisation.createdAt ?? cotisation.dateDebut,
              status: cotisation.statut,
              amount: cotisation.montant,
            })),
            ...certs.map((certificate) => ({
              type: 'document' as const,
              label: certificate.certificateType === 'membership_card' ? 'Carte de membre' : 'Attestation associative',
              date: certificate.issuedAt,
              status: 'émis',
              amount: null,
            })),
          ]
            .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
            .slice(0, 5);

          return {
            ...m,
            contributions: {
              cotisationsCount: cotis.length,
              lastContribution: recentContributions[0]?.date ?? null,
              historyCount: history.length,
              certificatesCount: certs.length,
              recent: recentContributions,
            }
          };
        }));

        return enriched;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        return getMemberById(input.id);
      }),


    
    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
        function: z.string().optional(),
        status: memberStatusSchema.optional(),
        gender: z.enum(["1", "2", "3"]).optional().default("3"),
        memberID: z.string().optional(),
        photo: z.string().optional(),
        membershipCategory: z.enum(["standard", "etudiant", "bienfaiteur", "fondateur", "actif", "honoraire"]).optional().default("standard"),
        skills: z.string().optional(),
        availability: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        const result = await createMember(input as any);
        await recordMemberStatus({
          memberId: result.id as number,
          status: input.status ?? "active",
          reason: "Création du membre",
          changedBy: ctx.user.id,
        });
        await logActivity({
          userId: ctx.user.id,
          action: "create",
          entityType: "member",
          entityId: result.id as number,
          details: `Membre "${input.firstName} ${input.lastName}" ajouté avec l'ID ${result.memberId}`,
        });
        await notifyOwner({
          title: "Nouveau membre ajouté",
          content: `${input.firstName} ${input.lastName} a été ajouté comme membre avec l'ID: ${result.memberId}`,
        });
        return result;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
        function: z.string().optional(),
        status: memberStatusSchema.optional(),
        photo: z.string().optional(),
        statusReason: z.string().trim().max(500).optional(),
        membershipCategory: z.enum(["standard", "etudiant", "bienfaiteur", "fondateur", "actif", "honoraire"]).optional(),
        skills: z.string().optional(),
        availability: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        const { id, statusReason, ...data } = input;
        const current = await getMemberById(id);
        if (!current) throw new Error("Membre non trouvé");
        const result = await updateMember(id, data);

        for (const [fieldName, newValue] of Object.entries(data)) {
          if (newValue === undefined) continue;
          const oldValue = (current as Record<string, unknown>)[fieldName];
          if (String(oldValue ?? "") !== String(newValue ?? "")) {
            await recordMemberHistory({ memberId: id, fieldName, oldValue, newValue, changedBy: ctx.user.id });
          }
        }
        if (data.status && data.status !== current.status) {
          await recordMemberStatus({ memberId: id, status: data.status, reason: statusReason, changedBy: ctx.user.id });
        }
        await logActivity({
          userId: ctx.user.id,
          action: "update",
          entityType: "member",
          entityId: id,
          details: data.status && data.status !== current.status
            ? `Statut du membre modifié : ${current.status} → ${data.status}`
            : `Membre mis à jour`,
        });
        return result;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        await deleteMember(input.id);
        await logActivity({
          userId: ctx.user.id,
          action: "delete",
          entityType: "member",
          entityId: input.id,
          details: `Membre supprimé`,
        });
        return { success: true };
      }),
    
    uploadPhoto: protectedProcedure
      .input(z.object({
        memberId: z.number().int().positive(),
        photoData: z.string().min(1).max(12 * 1024 * 1024),
        fileName: z.string().trim().min(1).max(255),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(input.photoData.split(',')[1] || input.photoData, 'base64');
          
          // Upload to S3
          const fileKey = `members/${input.memberId}/photo-${nanoid()}.jpg`;
          const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
          
          // Update member with photo URL
          const db = await getDb();
          if (db) {
            await db.update(members)
              .set({ photo: url })
              .where(eq(members.id, input.memberId));
          }
          
          await logActivity({
            userId: ctx.user.id,
            action: "update",
            entityType: "member",
            entityId: input.memberId,
            details: `Photo du membre mise à jour`,
          });
          
          return { success: true, photoUrl: url };
        } catch (error) {
          console.error('Photo upload error:', error);
          throw new Error('Erreur lors de l\'upload de la photo');
        }
      }),
    
    deletePhoto: protectedProcedure
      .input(z.object({
        memberId: z.number().int().positive(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        try {
          const db = await getDb();
          if (db) {
            await db.update(members)
              .set({ photo: null })
              .where(eq(members.id, input.memberId));
          }
          
          await logActivity({
            userId: ctx.user.id,
            action: "update",
            entityType: "member",
            entityId: input.memberId,
            details: `Photo du membre supprimée`,
          });
          
          return { success: true };
        } catch (error) {
          console.error('Photo delete error:', error);
          throw new Error('Erreur lors de la suppression de la photo');
        }
      }),
    
    getAdhesionCard: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        const member = await getMemberById(input.memberId);
        if (!member) throw new Error('Membre non trouvé');
        
        // Get latest adhesion
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const latestAdhesion = await db.select()
          .from(adhesions)
          .where(eq(adhesions.memberId, input.memberId))
          .orderBy(desc(adhesions.dateExpiration))
          .limit(1);
        
        return {
          member,
          adhesion: latestAdhesion[0] || null,
          card: {
            memberCode: member.memberId,
            status: member.status,
            statusLabel: member.status,
            qrPayload: buildMemberCardPayload(member),
          },
        };
      }),
    
    history: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        return getMemberHistory(input.memberId);
      }),

    statusHistory: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        return getMemberStatusHistory(input.memberId);
      }),

    changeStatus: protectedProcedure
      .input(z.object({
        memberId: z.number().int().positive(),
        status: memberStatusSchema,
        reason: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        const current = await getMemberById(input.memberId);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
        if (current.status === input.status) return current;
        const result = await updateMember(input.memberId, { status: input.status } as any);
        await recordMemberHistory({ memberId: input.memberId, fieldName: "status", oldValue: current.status, newValue: input.status, changedBy: ctx.user.id });
        await recordMemberStatus({ memberId: input.memberId, status: input.status, reason: input.reason, changedBy: ctx.user.id });
        await logAudit({
          userId: ctx.user.id,
          action: "UPDATE",
          entityType: "member_status",
          entityId: input.memberId,
          entityName: `${current.firstName} ${current.lastName}`,
          description: `Statut modifié : ${current.status} → ${input.status}`,
          oldValue: JSON.stringify({ status: current.status }),
          newValue: JSON.stringify({ status: input.status, reason: input.reason ?? null }),
          status: "success",
        });
        return result;
      }),

    card: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
        return {
          member,
          cardPayload: buildMemberCardPayload(member),
        };
      }),

    getEvaluations: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        return getMemberEvaluations(input.memberId);
      }),

    getGrade: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        return getMemberGrade(input.memberId);
      }),

    evaluateAndPromote: protectedProcedure
      .input(z.object({
        memberId: z.number().int().positive(),
        score: z.number().int().min(0).max(100),
        gradeProposed: z.string().trim().min(1).max(100),
        responsibilitiesAssigned: z.string().trim().max(1000).optional(),
        comments: z.string().trim().min(1).max(2000),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
        if (member.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Seuls les membres actifs peuvent être évalués et promus." });
        }
        if (!MEMBER_GRADE_LEVELS.some((grade) => grade.value === input.gradeProposed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Grade non reconnu." });
        }
        if (!canAssignMemberGrade(input.score, input.gradeProposed)) {
          const requiredScore = MEMBER_GRADE_LEVELS.find((grade) => grade.value === input.gradeProposed)?.minimumScore ?? 0;
          throw new TRPCError({ code: "BAD_REQUEST", message: `La note minimale pour ce grade est de ${requiredScore}/100.` });
        }

        const previousGrade = await getMemberGrade(input.memberId);
        const evaluation = await createMemberEvaluation({
          memberId: input.memberId,
          evaluatorId: ctx.user.id,
          score: input.score,
          gradeProposed: input.gradeProposed,
          responsibilitiesAssigned: input.responsibilitiesAssigned,
          comments: input.comments,
        });

        await recordMemberHistory({
          memberId: input.memberId,
          fieldName: "grade",
          oldValue: previousGrade.currentGrade,
          newValue: `${input.gradeProposed}${input.responsibilitiesAssigned ? ` — Responsabilités : ${input.responsibilitiesAssigned}` : ""}`,
          changedBy: ctx.user.id,
        });

        await logActivity({
          userId: ctx.user.id,
          action: "update",
          entityType: "member",
          entityId: input.memberId,
          details: `Membre #${input.memberId} évalué et promu au grade de ${input.gradeProposed}`,
        });

        await logAudit({
          userId: ctx.user.id,
          action: "PROMOTE",
          entityType: "member",
          entityId: input.memberId,
          entityName: `${member.firstName} ${member.lastName}`,
          description: `Membre évalué (score ${input.score}) et promu au grade ${input.gradeProposed}`,
          status: "success",
        });

        return evaluation;
      }),

  // ============ MEMBER PROFILE & ADVANCED ============
    portalProfile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
      const rows = await db.select().from(members).where(eq(members.userId, ctx.user.id)).limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun profil membre lié à ce compte" });
      const [history, statusHistory] = await Promise.all([
        getMemberHistory(rows[0].id),
        getMemberStatusHistory(rows[0].id),
      ]);
      return { member: rows[0], history, statusHistory, cardPayload: buildMemberCardPayload(rows[0]) };
    }),

    updateAdvancedProfile: protectedProcedure
      .input(z.object({
        id: z.number(),
        membershipCategory: z.enum(['standard','etudiant','bienfaiteur','fondateur','actif','honoraire']).optional(),
        skills: z.string().optional(),
        availability: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        const { id, ...data } = input;
        const result = await updateMember(id, data);
        await logActivity({
          userId: ctx.user.id,
          action: "update",
          entityType: "member_advanced",
          entityId: id,
          details: `Profil avancé du membre mis à jour (catégorie, compétences, disponibilités)`,
        });
        return result;
      }),

    issueCertificate: protectedProcedure
      .input(z.object({
        memberId: z.number(),
        certificateType: z.enum(['membership_card','tax_receipt','attestation']),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.manage");
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
        const refNumber = `CERT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const cert = await createMemberCertificate({
          memberId: input.memberId,
          certificateType: input.certificateType,
          referenceNumber: refNumber,
          pdfUrl: `/api/certificates/${input.memberId}/${refNumber}.pdf`,
        });
        await logActivity({
          userId: ctx.user.id,
          action: "create",
          entityType: "member_certificate",
          entityId: cert.id as number,
          details: `Attestation/Carte ${input.certificateType} émise (${refNumber}) pour ${member.firstName} ${member.lastName}`,
        });
        return cert;
      }),

    listCertificates: protectedProcedure
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "members.view");
        return getMemberCertificates(input.memberId);
      }),

    updateSelf: protectedProcedure
      .input(z.object({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().trim().max(20).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        const rows = await db.select().from(members).where(eq(members.userId, ctx.user.id)).limit(1);
        const current = rows[0];
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun profil membre lié à ce compte" });
        const result = await updateMember(current.id, input);
        for (const [fieldName, newValue] of Object.entries(input)) {
          const oldValue = (current as Record<string, unknown>)[fieldName];
          if (String(oldValue ?? "") !== String(newValue ?? "")) {
            await recordMemberHistory({ memberId: current.id, fieldName, oldValue, newValue, changedBy: ctx.user.id });
          }
        }
        await logActivity({ userId: ctx.user.id, action: "update", entityType: "member", entityId: current.id, details: "Profil membre mis à jour par son titulaire" });
        return result;
      }),

    // Export members list
    exportList: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "members.view");
      const membersList = await getAllMembers();
      return {
        members: membersList.map(m => ({
          id: m.id,
          fullName: `${m.firstName} ${m.lastName}`,
          email: m.email || "",
          phone: m.phone || "",
          role: m.role || "Membre",
          function: m.function || "",
          status: m.status === "active" ? "Actif" : m.status === "inactive" ? "Inactif" : "En attente",
          joinedAt: m.joinedAt,
        })),
        total: membersList.length,
        generatedAt: new Date(),
      };
    }),
  }),

  // ============ NOTIFICATIONS ============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional(), limit: z.number().int().min(1).max(100).optional(), offset: z.number().int().min(0).optional() }).optional())
      .query(({ ctx, input }) => listUserNotifications({ userId: ctx.user.id, ...input })),

    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number().int().positive() }))
      .mutation(({ ctx, input }) => markNotificationRead(ctx.user.id, input.notificationId)),

    markAllRead: protectedProcedure
      .mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),

    preferences: protectedProcedure.query(({ ctx }) => getOrCreateNotificationPreferences(ctx.user.id)),

    updatePreferences: protectedProcedure
      .input(z.object({
        inAppEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        typePreferences: z.record(z.string(), z.boolean()).optional(),
      }))
      .mutation(({ ctx, input }) => updateNotificationPreferences({ userId: ctx.user.id, ...input })),

    createForUser: protectedProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        title: z.string().trim().min(1).max(255),
        message: z.string().trim().min(1),
        type: z.enum(["info", "warning", "error", "success"]).optional(),
        actionUrl: z.string().max(1000).optional(),
        eventKey: z.string().max(100).optional(),
        entityType: z.string().max(80).optional(),
        entityId: z.number().int().positive().optional(),
        dedupeKey: z.string().max(255).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "admin.users.manage");
        return createUserNotification(input);
      }),
  }),

  // ============ ACTIVITY =========###
  activity: router({
    recent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => getRecentActivity(input?.limit || 20)),
  }),

  // ============ FINANCES ============
  finances: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finances.view");
      return getFinancialStats();
    }),

    cotisations: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finances.view");
      return getCotisations();
    }),

    dons: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finances.view");
      return getDons();
    }),

    depenses: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finances.view");
      return getDepenses();
    }),

    feeRules: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finances.view");
      return getMembershipFeeRules();
    }),

    suggestedFee: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive(), currency: z.enum(["EUR", "XOF"]) }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.view");
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre non trouvé" });
        const category = member.membershipCategory ?? "standard";
        const rule = await getActiveMembershipFeeRule(category, input.currency);
        return {
          category,
          currency: input.currency,
          amount: rule ? Number.parseFloat(rule.amount) : null,
          rule,
        };
      }),

    createFeeRule: protectedProcedure
      .input(z.object({
        category: z.enum(["standard", "etudiant", "bienfaiteur", "fondateur", "actif", "honoraire"]),
        currency: z.enum(["EUR", "XOF"]),
        amount: z.union([z.string(), z.number()]),
        validFrom: z.string().date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.manage");
        const amount = parseFinancialAmount(input.amount);
        const result = await createMembershipFeeRule({
          category: input.category,
          currency: input.currency,
          amount: amount.toFixed(2),
          isActive: 1,
          validFrom: input.validFrom ?? new Date().toISOString().slice(0, 10),
          createdBy: ctx.user.id,
        });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "membership_fee_rule", entityId: result.id, description: `Tarif d’adhésion ${input.category} créé`, newValue: JSON.stringify({ category: input.category, currency: input.currency, amount: amount.toFixed(2) }), status: "success" });
        return result;
      }),

    createCotisation: protectedProcedure
      .input(z.object({
        memberId: z.number().int().positive(),
        montant: z.union([z.string(), z.number()]).optional(),
        currency: z.enum(["EUR", "XOF"]),
        dateDebut: z.string().datetime(),
        dateFin: z.string().datetime(),
        notes: z.string().max(2000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.manage");
        const member = await getMemberById(input.memberId);
        if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre non trouvé" });
        const category = member.membershipCategory ?? "standard";
        const rule = input.montant === undefined ? await getActiveMembershipFeeRule(category, input.currency) : undefined;
        if (input.montant === undefined && !rule) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Aucun tarif actif n’est configuré pour la catégorie ${category} en ${input.currency}.` });
        }
        const amount = parseFinancialAmount(input.montant ?? rule!.amount);
        const { montant: _montant, ...cotisationData } = input;
        const result = await createCotisation({ ...cotisationData, montant: amount.toFixed(2) });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "cotisation", entityId: Number(result[0].insertId), description: `Cotisation créée pour le membre #${input.memberId}`, newValue: JSON.stringify({ amount: amount.toFixed(2), currency: input.currency, memberId: input.memberId }), status: "success" });
        return { success: true as const, amount, currency: input.currency, category, appliedFeeRuleId: rule?.id ?? null };
      }),

    createDon: protectedProcedure
      .input(z.object({
        donateur: z.string().trim().min(2).max(255),
        montant: z.union([z.string(), z.number()]),
        currency: z.enum(["EUR", "XOF"]),
        description: z.string().max(2000).optional(),
        email: z.string().email().optional(),
        telephone: z.string().max(30).optional(),
        date: z.string().datetime().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.manage");
        const amount = parseFinancialAmount(input.montant);
        const result = await createDon({ ...input, montant: amount.toFixed(2), date: input.date ?? new Date().toISOString() });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "don", entityId: Number(result[0].insertId), description: `Don enregistré de ${input.donateur}`, newValue: JSON.stringify({ amount: amount.toFixed(2), currency: input.currency }), status: "success" });
        return { success: true as const, amount, currency: input.currency };
      }),

    createDepense: protectedProcedure
      .input(z.object({
        description: z.string().trim().min(2).max(255),
        montant: z.union([z.string(), z.number()]),
        currency: z.enum(["EUR", "XOF"]),
        categorie: z.string().trim().min(2).max(100),
        date: z.string().datetime().optional(),
        notes: z.string().max(2000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.manage");
        const amount = parseFinancialAmount(input.montant);
        const result = await createDepense({ ...input, montant: amount.toFixed(2), date: input.date ?? new Date().toISOString() });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "depense", entityId: Number(result[0].insertId), description: `Dépense enregistrée : ${input.description}`, newValue: JSON.stringify({ amount: amount.toFixed(2), currency: input.currency, categorie: input.categorie }), status: "success" });
        return { success: true as const, amount, currency: input.currency };
      }),

    convertAmount: protectedProcedure
      .input(z.object({
        amount: z.union([z.string(), z.number()]),
        from: z.enum(["EUR", "XOF"]),
        to: z.enum(["EUR", "XOF"]),
      }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.view");
        const amount = parseFinancialAmount(input.amount);
        const converted = convertFinancialAmount(amount, input.from, input.to);
        return {
          amount,
          converted,
          from: input.from,
          to: input.to,
          formatted: formatFinancialAmount(converted, input.to),
        };
      }),

    receipts: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.view");
        return listTaxReceipts(input?.limit);
      }),

    issueReceipt: protectedProcedure
      .input(z.object({
        documentType: z.enum(["tax_receipt", "donation_certificate"]).default("tax_receipt"),
        donorName: z.string().trim().min(2).max(255),
        donorEmail: z.string().email().optional(),
        amount: z.union([z.string(), z.number()]),
        currency: z.enum(["EUR", "XOF"]),
        donationDate: z.string().datetime(),
        associationName: z.string().trim().min(2).max(255).default("Les Bâtisseurs Engagés"),
        legalMention: z.string().trim().max(1000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "finances.manage");
        const receipt = await createTaxReceipt({ ...input, issuedBy: ctx.user.id });
        await logAudit({
          userId: ctx.user.id,
          action: "CREATE",
          entityType: "finances",
          entityId: receipt.id,
          entityName: receipt.receiptNumber,
          description: `${input.documentType === "tax_receipt" ? "Reçu fiscal" : "Certificat de don"} généré pour ${input.donorName}`,
          newValue: JSON.stringify({ amount: receipt.amount, currency: receipt.currency }),
          status: "success",
        });
        return receipt;
      }),
    generateMembershipReminders: protectedProcedure.mutation(async ({ ctx }) => {
      await assertPermission(ctx.user, "finances.manage");
      return generateMembershipReminderNotifications();
    }),

    setupMembershipReminderSchedule: protectedProcedure
      .input(z.object({ cron: z.string().regex(/^\\d+ \\d+ \\d+ \\* \\* \\*$/).default("0 0 9 * * *") }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "finances.manage");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        const existing = await db.select().from(notificationSchedules).where(eq(notificationSchedules.name, "membership-reminders")).limit(1);
        if (existing[0]?.scheduleCronTaskUid) return { success: true as const, schedule: existing[0], alreadyConfigured: true as const };
        const cookie = parseCookieHeader(ctx.req.headers.cookie ?? "");
        const sessionToken = cookie[COOKIE_NAME] ?? "";
        const job = await createHeartbeatJob({
          name: "membership-reminders",
          cron: input.cron,
          path: "/api/scheduled/membership-reminders",
          description: "Rappels quotidiens des adhésions expirées ou proches de l’échéance",
        }, sessionToken);
        if (existing[0]) {
          await db.update(notificationSchedules).set({ scheduleCronTaskUid: job.taskUid, cronExpression: input.cron, isEnabled: 1 }).where(eq(notificationSchedules.id, existing[0].id));
        } else {
          await db.insert(notificationSchedules).values({ name: "membership-reminders", scheduleCronTaskUid: job.taskUid, cronExpression: input.cron, isEnabled: 1 });
        }
        const schedule = await db.select().from(notificationSchedules).where(eq(notificationSchedules.name, "membership-reminders")).limit(1);
        return { success: true as const, schedule: schedule[0] ?? null, alreadyConfigured: false as const };
      }),
  }),

  // ============ ADMIN - ROLES & PERMISSIONS ============
  admin: router({
    // Roles management
    getRoles: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "admin.roles.view");
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(roles);
      } catch (error) {
        console.error("Failed to get roles:", error);
        return [];
      }
    }),

    getPermissions: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "admin.roles.view");
      await ensureDefaultPermissions();
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(permissions);
      } catch (error) {
        console.error("Failed to get permissions:", error);
        return [];
      }
    }),

    getRolePermissions: protectedProcedure
      .input(z.object({ roleId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.roles.view");
        const db = await getDb();
        if (!db) return [];
        return db
          .select({
            id: permissions.id,
            name: permissions.name,
            description: permissions.description,
            category: permissions.category,
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, input.roleId));
      }),

    assignPermissionToRole: protectedProcedure
      .input(z.object({ roleId: z.number().int().positive(), permissionId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.roles.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const existing = await db
          .select({ id: rolePermissions.id })
          .from(rolePermissions)
          .where(and(eq(rolePermissions.roleId, input.roleId), eq(rolePermissions.permissionId, input.permissionId)))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(rolePermissions).values(input);
        }
        return { success: true } as const;
      }),

    removePermissionFromRole: protectedProcedure
      .input(z.object({ roleId: z.number().int().positive(), permissionId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.roles.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(rolePermissions).where(and(eq(rolePermissions.roleId, input.roleId), eq(rolePermissions.permissionId, input.permissionId)));
        return { success: true } as const;
      }),

    listUserRoles: protectedProcedure
      .input(z.object({ userId: z.number().int().positive().optional() }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.roles.view");
        const db = await getDb();
        if (!db) return [];
        const query = db.select({
          id: userRoles.id,
          userId: userRoles.userId,
          roleId: userRoles.roleId,
          roleName: roles.name,
          roleDescription: roles.description,
          assignedBy: userRoles.assignedBy,
          assignedAt: userRoles.assignedAt,
        }).from(userRoles).innerJoin(roles, eq(userRoles.roleId, roles.id));
        if (input?.userId) return query.where(eq(userRoles.userId, input.userId));
        return query;
      }),

    assignRoleToUser: protectedProcedure
      .input(z.object({ userId: z.number().int().positive(), roleId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.users.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const existing = await db
          .select({ id: userRoles.id })
          .from(userRoles)
          .where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(userRoles).values({ ...input, assignedBy: ctx.user.id });
        }
        await logAudit({ userId: ctx.user.id, action: "ASSIGN", entityType: "user_role", entityId: input.userId, description: `Role ${input.roleId} assigned to user ${input.userId}`, status: "success" });
        return { success: true } as const;
      }),

    removeRoleFromUser: protectedProcedure
      .input(z.object({ userId: z.number().int().positive(), roleId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.users.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(userRoles).where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)));
        await logAudit({ userId: ctx.user.id, action: "REMOVE", entityType: "user_role", entityId: input.userId, description: `Role ${input.roleId} removed from user ${input.userId}`, status: "success" });
        return { success: true } as const;
      }),

    listUserScopes: protectedProcedure
      .input(z.object({ userId: z.number().int().positive().optional() }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.scopes.view");
        const db = await getDb();
        if (!db) return [];
        if (input?.userId) return db.select().from(userScopes).where(eq(userScopes.userId, input.userId));
        return db.select().from(userScopes);
      }),

    assignUserScope: protectedProcedure
      .input(z.object({
        userId: z.number().int().positive(),
        scopeType: z.enum(["national", "antenne", "groupe", "project"]),
        scopeId: z.number().int().positive().nullable().optional(),
        accessLevel: z.enum(["viewer", "editor", "manager"]).default("viewer"),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.scopes.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        if (input.scopeType === "national" && input.scopeId != null) {
          throw new Error("Un périmètre national ne doit pas avoir de scopeId");
        }
        const result = await db.insert(userScopes).values({
          userId: input.userId,
          scopeType: input.scopeType,
          scopeId: input.scopeId ?? null,
          accessLevel: input.accessLevel,
          assignedBy: ctx.user.id,
        });
        await logAudit({ userId: ctx.user.id, action: "ASSIGN", entityType: "user_scope", entityId: Number(result[0].insertId), description: `Scope ${input.scopeType}:${input.scopeId ?? "national"} assigned`, status: "success" });
        return { id: Number(result[0].insertId), ...input, scopeId: input.scopeId ?? null };
      }),

    removeUserScope: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.scopes.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(userScopes).where(eq(userScopes.id, input.id));
        await logAudit({ userId: ctx.user.id, action: "REMOVE", entityType: "user_scope", entityId: input.id, description: `Scope ${input.id} removed`, status: "success" });
        return { success: true } as const;
      }),

    createRole: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.roles.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        try {
          const result = await db.insert(roles).values({
            name: input.name,
            description: input.description,
            isSystem: 0,
          });
          
          // Log audit
          await logAudit({
            userId: ctx.user?.id,
            action: "CREATE",
            entityType: "roles",
            entityName: input.name,
            description: `Created role: ${input.name}`,
            status: "success",
          });
          
          return result;
        } catch (error) {
          console.error("Failed to create role:", error);
          throw error;
        }
      }),

    updateRole: protectedProcedure
      .input(z.object({
        roleId: z.number().int().positive(),
        name: z.string().trim().min(1).max(100),
        description: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.roles.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const existing = await db.select().from(roles).where(eq(roles.id, input.roleId)).limit(1);
        const role = existing[0];
        if (!role) throw new Error("Rôle introuvable");
        if (role.isSystem) throw new Error("Les rôles système ne peuvent pas être modifiés");

        await db.update(roles).set({
          name: input.name,
          description: input.description?.trim() || null,
        }).where(eq(roles.id, input.roleId));
        await logAudit({
          userId: ctx.user.id,
          action: "UPDATE",
          entityType: "roles",
          entityId: input.roleId,
          entityName: input.name,
          description: `Role ${input.roleId} updated`,
          status: "success",
        });
        const updated = await db.select().from(roles).where(eq(roles.id, input.roleId)).limit(1);
        return updated[0];
      }),

    deleteRole: protectedProcedure
      .input(z.object({ roleId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.roles.manage");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const existing = await db.select().from(roles).where(eq(roles.id, input.roleId)).limit(1);
        const role = existing[0];
        if (!role) throw new Error("Rôle introuvable");
        if (role.isSystem) throw new Error("Les rôles système ne peuvent pas être supprimés");

        const assignments = await db.select({ id: userRoles.id }).from(userRoles).where(eq(userRoles.roleId, input.roleId)).limit(1);
        if (assignments.length > 0) {
          throw new Error("Impossible de supprimer un rôle encore attribué à un utilisateur");
        }
        await db.delete(rolePermissions).where(eq(rolePermissions.roleId, input.roleId));
        await db.delete(roles).where(eq(roles.id, input.roleId));
        await logAudit({
          userId: ctx.user.id,
          action: "DELETE",
          entityType: "roles",
          entityId: input.roleId,
          entityName: role.name,
          description: `Role ${input.roleId} deleted`,
          status: "success",
        });
        return { success: true } as const;
      }),

    getAuditLogs: protectedProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).default(0),
        entityType: z.string().trim().min(1).optional(),
        userId: z.number().int().positive().optional(),
        action: z.string().trim().min(1).optional(),
      }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "admin.audit.view");
        const db = await getDb();
        if (!db) return [];
        
        try {
          const result = await db.select().from(auditLogs);
          let filtered = result;
          
          if (input.entityType) {
            filtered = filtered.filter(log => log.entityType === input.entityType);
          }
          if (input.userId) {
            filtered = filtered.filter(log => log.userId === input.userId);
          }
          if (input.action) {
            filtered = filtered.filter(log => log.action === input.action);
          }
          
          return filtered
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(input.offset, input.offset + input.limit);
        } catch (error) {
          console.error("Failed to get audit logs:", error);
          return [];
        }
       }),
  }),

  // ============ COMMUNICATION ============
  announcements: router({
    getAll: protectedProcedure
      .input(z.object({
        status: z.enum(["draft", "published", "archived"]).optional(),
        category: z.string().trim().min(1).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.view");
        const rows = await getAnnouncements();
        return rows.filter((row) => {
          if (input?.status && row.status !== input.status) return false;
          if (input?.category && row.category !== input.category) return false;
          return true;
        });
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().trim().min(2).max(255),
        content: z.string().trim().min(1),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        category: z.string().trim().min(1).max(100).default("general"),
        status: z.enum(["draft", "published", "archived"]).default("published"),
        expiresAt: z.string().trim().min(1).nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.manage");
        const id = await createAnnouncement({
          title: input.title,
          content: input.content,
          priority: input.priority,
          category: input.category,
          authorId: ctx.user.id,
          status: input.status,
          publishedAt: input.status === "published" ? new Date().toISOString() : null,
          expiresAt: input.expiresAt || null,
        });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "announcement", entityId: id, entityName: input.title, description: `Announcement ${id} created`, status: "success" });
        return { id } as const;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(2).max(255).optional(),
        content: z.string().trim().min(1).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        category: z.string().trim().min(1).max(100).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        expiresAt: z.string().trim().min(1).nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.manage");
        const { id, ...changes } = input;
        await updateAnnouncement(id, {
          ...changes,
          publishedAt: input.status === "published" ? new Date().toISOString() : undefined,
          expiresAt: input.expiresAt === undefined ? undefined : input.expiresAt || null,
        });
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "announcement", entityId: id, description: `Announcement ${id} updated`, status: "success" });
        return { success: true } as const;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.manage");
        await deleteAnnouncement(input.id);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "announcement", entityId: input.id, description: `Announcement ${input.id} deleted`, status: "success" });
        return { success: true } as const;
      }),
  }),

  news: router({
    getAll: protectedProcedure
      .input(z.object({
        status: z.enum(["draft", "published", "archived"]).optional(),
        category: z.string().trim().min(1).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.view");
        const rows = await getNewsList();
        return rows.filter((row) => {
          if (input?.status && row.status !== input.status) return false;
          if (input?.category && row.category !== input.category) return false;
          return true;
        });
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().trim().min(2).max(255),
        content: z.string().trim().min(1),
        excerpt: z.string().trim().max(500).optional(),
        category: z.string().trim().min(1).max(100).default("general"),
        status: z.enum(["draft", "published", "archived"]).default("draft"),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.manage");
        const id = await createNews({
          title: input.title,
          content: input.content,
          excerpt: input.excerpt || null,
          category: input.category,
          status: input.status,
          authorId: ctx.user.id,
          publishedAt: input.status === "published" ? new Date().toISOString() : null,
          viewCount: 0,
        });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "news", entityId: id, entityName: input.title, description: `News ${id} created`, status: "success" });
        return { id } as const;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        title: z.string().trim().min(2).max(255).optional(),
        content: z.string().trim().min(1).optional(),
        excerpt: z.string().trim().max(500).nullable().optional(),
        category: z.string().trim().min(1).max(100).optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.manage");
        const { id, ...changes } = input;
        await updateNews(id, {
          ...changes,
          publishedAt: input.status === "published" ? new Date().toISOString() : undefined,
          excerpt: input.excerpt === undefined ? undefined : input.excerpt || null,
        });
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "news", entityId: id, description: `News ${id} updated`, status: "success" });
        return { success: true } as const;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.manage");
        await deleteNews(input.id);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "news", entityId: input.id, description: `News ${input.id} deleted`, status: "success" });
        return { success: true } as const;
      }),

    getComments: protectedProcedure
      .input(z.object({ newsId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.view");
        return getNewsComments(input.newsId);
      }),

    addComment: protectedProcedure
      .input(z.object({ newsId: z.number().int().positive(), content: z.string().trim().min(1).max(5000) }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.view");
        const id = await addNewsComment({ newsId: input.newsId, authorId: ctx.user.id, content: input.content });
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "news_comment", entityId: id, description: `Comment ${id} added to news ${input.newsId}`, status: "success" });
        return { id } as const;
      }),

    deleteComment: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        await assertPermission(ctx.user, "communication.view");
        await deleteNewsComment(input.id, ctx.user.role === "admin" ? undefined : ctx.user.id);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "news_comment", entityId: input.id, description: `Comment ${input.id} deleted`, status: "success" });
        return { success: true } as const;
      }),
  }),

  // ============ GLOBAL SETTINGS ============
  globalSettings: router({
    get: publicProcedure.query(async () => {
      await initializeGlobalSettings();
      return getGlobalSettings();
    }),

    update: protectedProcedure
      .input(z.object({
        associationName: z.string().optional(),
        seatCity: z.string().optional(),
        folio: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        phone: z.string().optional(),
        logo: z.string().nullable().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Only admins can update global settings");
        }
        
        const result = await updateGlobalSettings({
          ...input,
          updatedBy: ctx.user?.id,
        });
        
        await logAudit({
          userId: ctx.user?.id,
          action: "UPDATE",
          entityType: "globalSettings",
          entityName: "Global Settings",
          description: "Updated global settings",
          status: "success",
        });
        
        return result;
      }),
  }),

  // ============ PROJECTS ============
  projects: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0), status: z.string().optional() }))
      .query(async ({ input }) => {
        return await listProjects(input.limit, input.offset, input.status);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getProject(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        status: z.enum(["planning", "in-progress", "on-hold", "completed", "archived"]).default("planning"),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.string().optional(),
        leaderId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const project = await createProject({
          ...input,
          startDate: input.startDate ? input.startDate.toISOString() : undefined,
          endDate: input.endDate ? input.endDate.toISOString() : undefined,
          createdBy: ctx.user?.id || 0,
        } as any);

        await logAudit({
          userId: ctx.user?.id,
          action: "CREATE",
          entityType: "project",
          entityName: input.name,
          description: `Created project: ${input.name}`,
          status: "success",
        });

        return project;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["planning", "in-progress", "on-hold", "completed", "archived"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        budget: z.string().optional(),
        leaderId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const convertedData = {
          ...data,
          startDate: data.startDate ? data.startDate.toISOString() : undefined,
          endDate: data.endDate ? data.endDate.toISOString() : undefined,
        };
        const project = await updateProject(id, convertedData as any);

        await logAudit({
          userId: ctx.user?.id,
          action: "UPDATE",
          entityType: "project",
          entityName: project?.name || "Unknown",
          description: `Updated project: ${project?.name}`,
          status: "success",
        });

        return project;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const project = await getProject(input.id);
        await deleteProject(input.id);

        await logAudit({
          userId: ctx.user?.id,
          action: "DELETE",
          entityType: "project",
          entityName: project?.name || "Unknown",
          description: `Deleted project: ${project?.name}`,
          status: "success",
        });

        return { success: true };
      }),

    // Project Members
    addMember: protectedProcedure
      .input(z.object({ projectId: z.number(), memberId: z.number(), role: z.enum(["project-lead", "member", "observer"]).default("member") }))
      .mutation(async ({ input }) => {
        return await addProjectMember(input);
      }),

    getMembers: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectMembers(input.projectId);
      }),

    removeMember: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await removeProjectMember(input.id);
      }),

    // Project Tasks
    createTask: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(["todo", "in-progress", "in-review", "completed"]).default("todo"),
        priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        assignedTo: z.number().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const convertedInput = {
          ...input,
          dueDate: input.dueDate ? input.dueDate.toISOString() : undefined,
        };
        return await createProjectTask(convertedInput as any);
      }),

    getTasks: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectTasks(input.projectId);
      }),

    updateTask: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["todo", "in-progress", "in-review", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        assignedTo: z.number().optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const convertedData = {
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        };
        return await updateProjectTask(id, convertedData as any);
      }),

    deleteTask: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteProjectTask(input.id);
      }),

    getTaskComments: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectTaskComments(input.taskId);
      }),

    addTaskComment: protectedProcedure
      .input(z.object({ projectId: z.number(), taskId: z.number(), content: z.string().trim().min(1).max(5000) }))
      .mutation(async ({ input, ctx }) => {
        return await createProjectTaskComment({
          ...input,
          authorId: ctx.user?.id || 0,
        });
      }),

    deleteTaskComment: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteProjectTaskComment(input.id);
      }),

    report: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectReport(input.projectId);
      }),

    // Project Milestones
    createMilestone: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.date(),
        status: z.enum(["pending", "in-progress", "completed", "delayed"]).default("pending"),
      }))
      .mutation(async ({ input }) => {
        const convertedInput = {
          ...input,
          dueDate: input.dueDate.toISOString(),
        };
        return await createProjectMilestone(convertedInput as any);
      }),

    getMilestones: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectMilestones(input.projectId);
      }),

    updateMilestone: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        status: z.enum(["pending", "in-progress", "completed", "delayed"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const convertedData = {
          ...data,
          dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        };
        return await updateProjectMilestone(id, convertedData as any);
      }),

    deleteMilestone: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteProjectMilestone(input.id);
      }),

    // Project Updates
    createUpdate: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await createProjectUpdate({
          ...input,
          createdBy: ctx.user?.id || 0,
        });
      }),

    getUpdates: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectUpdates(input.projectId);
      }),

    // Project Budget
    getBudgetItems: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await getProjectBudgetItems(input.projectId);
      }),

    createBudgetItem: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        category: z.string(),
        amount: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await createProjectBudgetItem(input);
      }),

    updateBudgetItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.string().optional(),
        amount: z.string().optional(),
        spent: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateProjectBudgetItem(id, data);
      }),

    deleteBudgetItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteProjectBudgetItem(input.id);
      }),
  }),

  dashboard: router({
    statistics: protectedProcedure.query(async () => {
      return await getDashboardStatistics();
    }),

    summary: protectedProcedure.query(async () => {
      return await getGlobalDashboardSummary();
    }),

    projects: protectedProcedure.query(async () => {
      return await getProjectsStatistics();
    }),

    tasks: protectedProcedure.query(async () => {
      return await getTasksStatistics();
    }),

    finance: protectedProcedure.query(async () => {
      return await getFinanceStatistics();
    }),

    members: protectedProcedure.query(async () => {
      return await getMembersStatistics();
    }),

    signatureDelivery: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "signatures.view");
      return await getSignatureDeliveryDashboard();
    }),
  }),

  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Vous n'avez pas la permission d'acceder a cette ressource");
      }
      return await getAllUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.id !== input.id) {
          throw new Error("Vous n'avez pas la permission d'acceder a cette ressource");
        }
        return await getUserById(input.id);
      }),

    updateRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        newRole: z.enum(["admin", "user"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Vous n'avez pas la permission d'effectuer cette action");
        }

        if (input.userId === ctx.user.id && input.newRole === "user") {
          const adminCount = await getAdminCount();
          if (adminCount <= 1) {
            throw new Error("Il doit y avoir au moins un administrateur");
          }
        }

        await updateUserRole(input.userId, input.newRole);
        
        await logActivity({
          userId: ctx.user.id,
          action: "update",
          entityType: "user",
          entityId: input.userId,
          details: `Role de l'utilisateur change en ${input.newRole === "admin" ? "Administrateur" : "Utilisateur"}`,
        });

        return { success: true };
      }),

    getAdminCount: protectedProcedure.query(async () => {
      return await getAdminCount();
    }),

    isAdmin: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await isUserAdmin(input.userId);
      }),
  }),
});
export type AppRouter = typeof appRouter;
