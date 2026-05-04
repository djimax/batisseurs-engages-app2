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
  getProjectBudgetItems, createProjectBudgetItem, updateProjectBudgetItem, deleteProjectBudgetItem
} from "./db";
import { roles, permissions, auditLogs, emailTemplates, emailHistory, emailRecipients } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit } from "./audit";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";

// Note: Email procedures are now in email-router.ts and imported above

export const appRouter = router({
  system: systemRouter,
  email: emailRouter,
  adminSettings: adminSettingsRouter,
  crm: crmRouter,
  
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
        return getAllDocuments(input);
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
          createdBy: ctx.user.id,
        });
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
        const result = await updateDocument(id, { ...data, updatedBy: ctx.user.id });
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
          isArchived: true,
        });
      }),
    
    // Archive a document
    archive: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await updateDocument(input.id, {
          isArchived: true,
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
          isArchived: false,
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
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createMember(input);
        await logActivity({
          userId: ctx.user.id,
          action: "create",
          entityType: "member",
          entityId: result.id as number,
          details: `Membre "${input.firstName} ${input.lastName}" ajouté`,
        });
        await notifyOwner({
          title: "Nouveau membre ajouté",
          content: `${input.firstName} ${input.lastName} a été ajouté comme membre.`,
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
    getRoles: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(roles);
      } catch (error) {
        console.error("Failed to get roles:", error);
        return [];
      }
    }),

    getPermissions: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      try {
        return await db.select().from(permissions);
      } catch (error) {
        console.error("Failed to get permissions:", error);
        return [];
      }
    }),

    createRole: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        try {
          const result = await db.insert(roles).values({
            name: input.name,
            description: input.description,
            isSystem: false,
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
          createdBy: ctx.user?.id || 0,
        });

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
        const project = await updateProject(id, data);

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
        return await createProjectTask(input);
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
        return await updateProjectTask(id, data);
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
        return await createProjectMilestone(input);
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
        return await updateProjectMilestone(id, data);
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
});
export type AppRouter = typeof appRouter;
