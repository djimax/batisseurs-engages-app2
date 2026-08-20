import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { emailRouter } from "./email-router";
import { adminSettingsRouter } from "./admin-settings-router";
import { crmRouter } from "./crm-router";
import { z } from "zod";
import { 
  getAllCategories, getCategoryById, createCategory, seedDefaultCategories,
  getAllDocuments, getDocumentById, createDocument, updateDocument, deleteDocument, getDocumentStats, seedDefaultDocuments,
  getNotesByDocumentId, createNote, deleteNote,
  getAllMembers, getMemberById, createMember, updateMember, deleteMember,
  logActivity, getRecentActivity,
  createCotisation, getCotisations, getCotisationsByMember, updateCotisation,
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
  getProjectBudgetItems, createProjectBudgetItem, updateProjectBudgetItem, deleteProjectBudgetItem,
  getDashboardStatistics, getProjectsStatistics, getTasksStatistics, getFinanceStatistics, getMembersStatistics,
  getAllUsers, getUserById, updateUserRole, getAdminCount, isUserAdmin
} from "./db";
import { roles, permissions, rolePermissions, userRoles, userScopes, auditLogs, emailTemplates, emailHistory, emailRecipients, members, adhesions } from "../drizzle/schema";
import { and, eq, desc } from "drizzle-orm";
import { logAudit } from "./audit";
import { assertPermission, ensureDefaultPermissions } from "./authorization";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import { membersAdhesionsRouter } from "./members-adhesions-router";
import { antennasRouter, groupesRouter } from "./antennes-groupes-router";

// Note: Email procedures are now in email-router.ts and imported above

export const appRouter = router({
  system: systemRouter,
  email: emailRouter,
  adminSettings: adminSettingsRouter,
  crm: crmRouter,
  membersAdhesions: membersAdhesionsRouter,
  antennes: antennasRouter,
  groupes: groupesRouter,
  
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
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        search: z.string().optional(),
        isArchived: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        await seedDefaultCategories();
        await seedDefaultDocuments();
        return getAllDocuments({
          ...input,
          isArchived: input?.isArchived ? 1 : input?.isArchived === false ? 0 : undefined,
        });
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getDocumentById(input.id)),
    
    stats: publicProcedure.query(async () => {
      await seedDefaultCategories();
      await seedDefaultDocuments();
      return getDocumentStats();
    }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        categoryId: z.number(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createDocument({
          ...input,
          dueDate: input.dueDate ? input.dueDate.toISOString() : undefined,
          createdBy: ctx.user.id,
        } as any);
        await logActivity({
          userId: ctx.user.id,
          action: "create",
          entityType: "document",
          entityId: result.id as number,
          details: `Document "${input.title}" créé`,
        });
        await notifyOwner({
          title: "Nouveau document créé",
          content: `Le document "${input.title}" a été créé par ${ctx.user.name || "un utilisateur"}.`,
        });
        return result;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["pending", "in-progress", "completed"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueDate: z.date().nullable().optional(),
        isArchived: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
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
        return result;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteDocument(input.id);
        await logActivity({
          userId: ctx.user.id,
          action: "delete",
          entityType: "document",
          entityId: input.id,
          details: `Document supprimé`,
        });
        return { success: true };
      }),
    
    uploadFile: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        fileBase64: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { documentId, fileName, fileType, fileSize, fileBase64 } = input;
        
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(fileBase64, "base64");
        
        // Generate unique file key
        const fileKey = `documents/${documentId}/${nanoid()}-${fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, fileBuffer, fileType);
        
        // Update document with file info
        await updateDocument(documentId, {
          fileUrl: url,
          fileKey,
          fileName,
          fileType,
          fileSize,
          updatedBy: ctx.user.id,
        });
        
        await logActivity({
          userId: ctx.user.id,
          action: "upload",
          entityType: "document",
          entityId: documentId,
          details: `Fichier "${fileName}" uploadé`,
        });
        
        await notifyOwner({
          title: "Fichier uploadé",
          content: `Le fichier "${fileName}" a été uploadé par ${ctx.user.name || "un utilisateur"}.`,
        });
        
        return { success: true, url, fileKey };
      }),
    
    removeFile: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
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
    exportReport: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
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
    archived: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getAllDocuments({
          ...input,
          isArchived: 1,
        });
      }),
    
    // Archive a document
    archive: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
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
        await notifyOwner({
          title: "Document archivé",
          content: `Le document a été archivé par ${ctx.user.name || "un utilisateur"}.`,
        });
        return result;
      }),
    
    // Restore an archived document
    restore: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
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
        return result;
      }),
  }),

  // ============ NOTES ============
  notes: router({
    listByDocument: publicProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ input }) => getNotesByDocumentId(input.documentId)),
    
    create: protectedProcedure
      .input(z.object({
        documentId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
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
        return result;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteNote(input.id);
        await logActivity({
          userId: ctx.user.id,
          action: "delete",
          entityType: "note",
          entityId: input.id,
          details: `Note supprimée`,
        });
        return { success: true };
      }),
  }),

  // ============ MEMBERS ============
  members: router({
    list: protectedProcedure.query(async () => getAllMembers()),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getMemberById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        role: z.string().optional(),
        function: z.string().optional(),
        status: z.enum(["active", "inactive", "pending"]).optional(),
        gender: z.enum(["1", "2", "3"]).optional().default("3"),
        memberID: z.string().optional(),
        photo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createMember(input as any);
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
        status: z.enum(["active", "inactive", "pending"]).optional(),
        photo: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const result = await updateMember(id, data);
        await logActivity({
          userId: ctx.user.id,
          action: "update",
          entityType: "member",
          entityId: id,
          details: `Membre mis à jour`,
        });
        return result;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
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
        memberId: z.number(),
        photoData: z.string(), // base64 encoded image
        fileName: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
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
        memberId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
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
      .input(z.object({ memberId: z.number() }))
      .query(async ({ input }) => {
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
        };
      }),
    
    // Export members list
    exportList: protectedProcedure.query(async () => {
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

  // ============ ACTIVITY ============
  activity: router({
    recent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => getRecentActivity(input?.limit || 20)),
  }),

  // ============ FINANCES ============
  finances: router({
    stats: protectedProcedure.query(async () => getFinancialStats()),
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

    getAuditLogs: protectedProcedure
      .input(z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        entityType: z.string().optional(),
        userId: z.number().optional(),
      }))
      .query(async ({ input }) => {
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
          
          return filtered
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(input.offset, input.offset + input.limit);
        } catch (error) {
          console.error("Failed to get audit logs:", error);
          return [];
        }
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
