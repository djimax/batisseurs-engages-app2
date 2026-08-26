import { z } from "zod";
import { eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createCrmContact,
  getCrmContact,
  listCrmContacts,
  updateCrmContact,
  deleteCrmContact,
  createCrmActivity,
  listCrmActivities,
  updateCrmActivity,
  deleteCrmActivity,
  createAdhesionPipeline,
  updateAdhesionPipeline,
  listAdhesionPipeline,
  createCrmReport,
  listCrmReports,
  createCrmEmailIntegration,
  listCrmEmailIntegration,
} from "./db";
import { logAudit } from "./audit";

export const crmRouter = router({
  // ============ CONTACTS ============
  contacts: router({
    list: protectedProcedure
      .input(z.object({
        segment: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listCrmContacts(input);
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return getCrmContact(input);
      }),

    create: protectedProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string().optional(),
        position: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        birthDate: z.date().optional(),
        joinDate: z.date().optional(),
        segment: z.string().default("general"),
        status: z.enum(["prospect", "active", "inactive", "archived"]).default("prospect"),
        notes: z.string().optional(),
        tags: z.string().optional(),
        createdBy: z.number(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        const result = await createCrmContact(input as any);
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "crm_contact", entityId: result.id, entityName: `${input.firstName} ${input.lastName}`, description: "Contact CRM créé", status: "success" });
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          position: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
          birthDate: z.date().optional(),
          joinDate: z.date().optional(),
          segment: z.string().optional(),
          status: z.enum(["prospect", "active", "inactive", "archived"]).optional(),
          notes: z.string().optional(),
          tags: z.string().optional(),
          engagementScore: z.number().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        const result = await updateCrmContact(input.id, input.data as any);
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "crm_contact", entityId: input.id, description: "Contact CRM mis à jour", newValue: JSON.stringify(input.data), status: "success" });
        return result;
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        await deleteCrmContact(input);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "crm_contact", entityId: input, description: "Contact CRM supprimé", status: "success" });
        return { success: true };
      }),
  }),

  // ============ ACTIVITIES ============
  activities: router({
    list: protectedProcedure
      .input(z.number())
      .query(async ({ input }: any) => {
        return listCrmActivities(input);
      }),

    create: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        type: z.enum(["call", "email", "meeting", "task", "note", "event"]),
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.date().optional(),
        assignedTo: z.number().optional(),
        createdBy: z.number(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        const result = await createCrmActivity(input as any);
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "crm_activity", entityId: result.id, description: `Activité CRM créée pour le contact #${input.contactId}`, status: "success" });
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          status: z.enum(["pending", "completed", "cancelled"]).optional(),
          priority: z.enum(["low", "medium", "high"]).optional(),
          dueDate: z.date().optional(),
          completedDate: z.date().optional(),
          assignedTo: z.number().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        const result = await updateCrmActivity(input.id, input.data as any);
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "crm_activity", entityId: input.id, description: "Activité CRM mise à jour", newValue: JSON.stringify(input.data), status: "success" });
        return result;
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        await deleteCrmActivity(input);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "crm_activity", entityId: input, description: "Activité CRM supprimée", status: "success" });
        return { success: true };
      }),
  }),

  // ============ ADHESION PIPELINE ============
  pipeline: router({
    list: protectedProcedure
      .input(z.object({ stage: z.string().optional() }).optional())
      .query(async ({ input }: any) => {
        return listAdhesionPipeline(input?.stage);
      }),

    create: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        stage: z.enum(["inquiry", "application", "review", "approved", "rejected", "member"]).default("inquiry"),
        applicationDate: z.date().optional(),
        notes: z.string().optional(),
        assignedTo: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        return createAdhesionPipeline(input as any);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        stage: z.enum(["inquiry", "application", "review", "approved", "rejected", "member"]),
        approvalDate: z.date().optional(),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        return updateAdhesionPipeline(input.id, {
          stage: input.stage,
          approvalDate: input.approvalDate,
          rejectionReason: input.rejectionReason,
          updatedAt: new Date(),
        } as any);
      }),
  }),

  // ============ REPORTS ============
  reports: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input }: any) => {
        return listCrmReports(input?.type);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["engagement", "pipeline", "activity", "segment", "custom"]),
        description: z.string().optional(),
        data: z.any().optional(),
        filters: z.any().optional(),
        generatedBy: z.number(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        return createCrmReport(input as any);
      }),

    getEngagementMetrics: protectedProcedure
      .query(async ({ ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        // Placeholder for engagement metrics calculation
        return {
          totalContacts: 0,
          activeContacts: 0,
          engagementRate: 0,
          averageScore: 0,
        };
      }),
  }),

  // ============ EMAIL INTEGRATION ============
  email: router({
    getHistory: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return listCrmEmailIntegration(input);
      }),

    logEmail: protectedProcedure
      .input(z.object({
        contactId: z.number(),
        emailHistoryId: z.number().optional(),
        subject: z.string(),
        content: z.string().optional(),
        direction: z.enum(["sent", "received"]),
        status: z.enum(["sent", "failed", "bounced", "opened", "clicked"]).default("sent"),
        sentBy: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized: Admin only");
        }
        return createCrmEmailIntegration(input as any);
      }),
  }),
});
