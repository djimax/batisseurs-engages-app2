import { z } from "zod";
import {
  getEmailTemplates, getEmailTemplateById, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate,
  getEmailHistory, getEmailHistoryById, createEmailHistory, updateEmailHistory,
  getEmailRecipients, createEmailRecipient, updateEmailRecipient,
  getAllMembers,
} from "./db";
import { logAudit } from "./audit";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const emailRouter = router({
  // Email Templates
  templates: router({
    list: protectedProcedure.query(async () => {
      return await getEmailTemplates();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getEmailTemplateById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        content: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        variables: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const template = await createEmailTemplate({
          ...input,
          createdBy: ctx.user.id,
          variables: input.variables ? JSON.stringify(input.variables) : null,
        });
        await logAudit({
          userId: ctx.user?.id,
          action: "CREATE",
          entityType: "email_template",
          entityName: input.name,
          description: `Created email template: ${input.name}`,
          status: "success",
        });
        return template;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        subject: z.string().optional(),
        content: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        variables: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.variables) {
          updateData.variables = JSON.stringify(data.variables);
        }
        const template = await updateEmailTemplate(id, updateData);
        await logAudit({
          userId: ctx.user?.id,
          action: "UPDATE",
          entityType: "email_template",
          entityId: id,
          description: `Updated email template`,
          status: "success",
        });
        return template;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteEmailTemplate(input.id);
        await logAudit({
          userId: ctx.user?.id,
          action: "DELETE",
          entityType: "email_template",
          entityId: input.id,
          description: `Deleted email template`,
          status: "success",
        });
        return { success: true };
      }),
  }),

  // Send mass emails
  sendMassEmail: protectedProcedure
    .input(z.object({
      subject: z.string().min(1),
      content: z.string().min(1),
      templateId: z.number().optional(),
      recipientFilter: z.object({
        role: z.string().optional(),
        status: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const members = await getAllMembers();
        if (members.length === 0) {
          return {
            success: false,
            error: "No members found",
          };
        }

        // Create email history record
        const history = await createEmailHistory({
          templateId: input.templateId || null,
          subject: input.subject,
          content: input.content,
          recipientCount: members.length,
          sentBy: ctx.user.id,
          status: "sending",
        });

        let successCount = 0;
        let failureCount = 0;

        // Send emails to all members
        for (const member of members) {
          try {
            // Create recipient record
            await createEmailRecipient({
              emailHistoryId: history.id,
              recipientId: member.id,
              recipientEmail: member.email || "",
              status: "pending",
            });

            // Send email using Manus notification system
            const memberName = `${member.firstName} ${member.lastName}`.trim();
            const emailSent = await notifyOwner({
              title: `${input.subject} - ${memberName}`,
              content: `Email sent to ${member.email}:\n\n${input.content}`,
            });

            if (emailSent) {
              successCount++;
              // Update recipient status
              const recipients = await getEmailRecipients(history.id);
              const lastRecipient = recipients[recipients.length - 1];
              if (lastRecipient) {
                await updateEmailRecipient(lastRecipient.id, {
                  status: "sent",
                  sentAt: new Date(),
                });
              }
            } else {
              failureCount++;
            }
          } catch (error) {
            failureCount++;
            console.error(`Failed to send email to ${member.email}:`, error);
          }
        }

        // Update email history with final status
        await updateEmailHistory(history.id, {
          status: failureCount === 0 ? "sent" : "failed",
          successCount,
          failureCount,
          sentAt: new Date(),
        });

        await logAudit({
          userId: ctx.user?.id,
          action: "CREATE",
          entityType: "email_campaign",
          entityName: input.subject,
          description: `Sent mass email to ${successCount} members`,
          status: "success",
        });

        return {
          success: true,
          historyId: history.id,
          successCount,
          failureCount,
          totalCount: members.length,
        };
      } catch (error) {
        console.error("Error sending mass emails:", error);
        await logAudit({
          userId: ctx.user?.id,
          action: "CREATE",
          entityType: "email_campaign",
          entityName: input.subject,
          description: `Failed to send mass email`,
          status: "failed",
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),


  // Email history
  history: router({
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const history = await getEmailHistory(input.limit);
        return history.slice(input.offset, input.offset + input.limit);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const history = await getEmailHistoryById(input.id);
        if (!history) return null;
        const recipients = await getEmailRecipients(input.id);
        return { ...history, recipients };
      }),
  }),

  // Password reset
  resetPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      try {
        const title = "Demande de reinitialisation de mot de passe";
        const content = `Un utilisateur a demande une reinitialisation de mot de passe.\n\nEmail: ${input.email}\nDate: ${new Date().toLocaleString("fr-FR")}\n\nVeuillez generer un nouveau mot de passe et l'envoyer a cet utilisateur.`;
        
        await notifyOwner({ title, content });

        return { success: true, message: "Demande de reinitialisation envoyee" };
      } catch (error) {
        console.error("Error sending password reset notification:", error);
        return { success: false, error: "Erreur lors de l'envoi de la demande" };
      }
    }),
});
