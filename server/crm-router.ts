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
import { assertPermission } from "./authorization";

export const crmRouter = router({
  // ============ CONTACTS ============
  contacts: router({
    list: protectedProcedure
      .input(z.object({
        segment: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.view");
        return listCrmContacts(input);
      }),

    get: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.view");
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
        await assertPermission(ctx.user, "crm.manage");
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
        await assertPermission(ctx.user, "crm.manage");
        const result = await updateCrmContact(input.id, input.data as any);
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "crm_contact", entityId: input.id, description: "Contact CRM mis à jour", newValue: JSON.stringify(input.data), status: "success" });
        return result;
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.manage");
        await deleteCrmContact(input);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "crm_contact", entityId: input, description: "Contact CRM supprimé", status: "success" });
        return { success: true };
      }),
  }),

  // ============ ACTIVITIES ============
  activities: router({
    list: protectedProcedure
      .input(z.number())
      .query(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.view");
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
        await assertPermission(ctx.user, "crm.manage");
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
        await assertPermission(ctx.user, "crm.manage");
        const result = await updateCrmActivity(input.id, input.data as any);
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "crm_activity", entityId: input.id, description: "Activité CRM mise à jour", newValue: JSON.stringify(input.data), status: "success" });
        return result;
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.manage");
        await deleteCrmActivity(input);
        await logAudit({ userId: ctx.user.id, action: "DELETE", entityType: "crm_activity", entityId: input, description: "Activité CRM supprimée", status: "success" });
        return { success: true };
      }),
  }),

  // ============ ADHESION PIPELINE ============
  pipeline: router({
    list: protectedProcedure
      .input(z.object({ stage: z.string().optional() }).optional())
      .query(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.view");
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
        await assertPermission(ctx.user, "crm.manage");
        const result = await createAdhesionPipeline(input as any);
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "crm_adhesion_pipeline", entityId: result.id, description: `Entrée de pipeline créée pour le contact #${input.contactId}`, status: "success" });
        return result;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        stage: z.enum(["inquiry", "application", "review", "approved", "rejected", "member"]),
        approvalDate: z.date().optional(),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.manage");
        const result = await updateAdhesionPipeline(input.id, {
          stage: input.stage,
          approvalDate: input.approvalDate,
          rejectionReason: input.rejectionReason,
          updatedAt: new Date(),
        } as any);
        await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "crm_adhesion_pipeline", entityId: input.id, description: `Étape de pipeline mise à jour : ${input.stage}`, newValue: JSON.stringify({ stage: input.stage, rejectionReason: input.rejectionReason ?? null }), status: "success" });
        return result;
      }),
  }),

  // ============ REPORTS ============
  reports: router({
    list: protectedProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.view");
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
        await assertPermission(ctx.user, "crm.manage");
        const result = await createCrmReport(input as any);
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "crm_report", entityId: result.id, entityName: input.name, description: "Rapport CRM créé", status: "success" });
        return result;
      }),

    getEngagementMetrics: protectedProcedure
      .query(async ({ ctx }: any) => {
        await assertPermission(ctx.user, "crm.view");
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
      .query(async ({ input, ctx }: any) => {
        await assertPermission(ctx.user, "crm.view");
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
        await assertPermission(ctx.user, "crm.manage");
        const result = await createCrmEmailIntegration(input as any);
        await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "crm_email", entityId: result.id, description: `Email CRM journalisé pour le contact #${input.contactId}`, newValue: JSON.stringify({ direction: input.direction, status: input.status }), status: "success" });
        return result;
      }),
  }),
});
