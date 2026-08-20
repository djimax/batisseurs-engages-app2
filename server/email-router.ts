import { z } from "zod";
import {
  getEmailTemplates, getEmailTemplateById, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate,
  getEmailHistory, getEmailHistoryById, createEmailHistory, updateEmailHistory,
  getEmailRecipients, createEmailRecipient, updateEmailRecipient,
  getAllMembers,
  createPasswordResetRequest, listPasswordResetRequests, updatePasswordResetRequest, getPasswordResetRequest,
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
                  sentAt: new Date().toISOString(),
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
          sentAt: new Date().toISOString(),
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
        // Generate a unique token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Create password reset request
        const expiresAtDate = new Date();
        expiresAtDate.setHours(expiresAtDate.getHours() + 24); // Expire in 24 hours
        const expiresAt = expiresAtDate.toISOString();
        
        await createPasswordResetRequest({
          email: input.email,
          token,
          status: "pending",
          expiresAt,
        });
        
        const title = "Demande de reinitialisation de mot de passe";
        const content = `Un utilisateur a demande une reinitialisation de mot de passe.\n\nEmail: ${input.email}\nDate: ${new Date().toLocaleString("fr-FR")}\n\nVeuillez generer un nouveau mot de passe et l'envoyer a cet utilisateur.`;
        
        await notifyOwner({ title, content });

        return { success: true, message: "Demande de reinitialisation envoyee" };
      } catch (error) {
        console.error("Error sending password reset notification:", error);
        return { success: false, error: "Erreur lors de l'envoi de la demande" };
      }
    }),

  // Admin procedures for managing password reset requests
  passwordResets: router({
    // List all pending password reset requests
    list: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["pending", "completed", "expired"]).optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Only admins can list password reset requests
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        const requests = await listPasswordResetRequests(input.limit, input.offset);
        
        // Filter by status if provided
        if (input.status) {
          return requests.filter(r => r.status === input.status);
        }
        
        return requests;
      }),

    // Get a specific password reset request
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        return await getPasswordResetRequest(input.id);
      }),

    // Generate and send temporary password
    generatePassword: protectedProcedure
      .input(z.object({
        id: z.number(),
        temporaryPassword: z.string().min(8),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        const request = await getPasswordResetRequest(input.id);
        if (!request) {
          throw new Error("Password reset request not found");
        }
        
        // Update the request with the temporary password
        await updatePasswordResetRequest(input.id, {
          temporaryPassword: input.temporaryPassword,
          status: "completed",
          completedAt: new Date().toISOString(),
        });
        
        // Send email with temporary password
        const title = "Votre mot de passe temporaire";
        const content = `Bonjour,\n\nVoici votre mot de passe temporaire: ${input.temporaryPassword}\n\nVeuillez vous connecter et changer votre mot de passe immediatement.\n\nCordialement,\nLes Bâtisseurs Engagés`;
        
        await notifyOwner({ 
          title: `${title} - ${request.email}`, 
          content 
        });
        
        await logAudit({
          userId: ctx.user?.id,
          action: "UPDATE",
          entityType: "password_reset_request",
          entityId: input.id,
          description: `Generated temporary password for ${request.email}`,
          status: "success",
        });
        
        return { success: true, message: "Mot de passe temporaire genere et envoye" };
      }),

    // Approve a password reset request (without generating password)
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        const request = await getPasswordResetRequest(input.id);
        if (!request) {
          throw new Error("Password reset request not found");
        }
        
        await updatePasswordResetRequest(input.id, {
          status: "completed",
          completedAt: new Date().toISOString(),
        });
        
        await logAudit({
          userId: ctx.user?.id,
          action: "UPDATE",
          entityType: "password_reset_request",
          entityId: input.id,
          description: `Approved password reset for ${request.email}`,
          status: "success",
        });
        
        return { success: true, message: "Demande approuvee" };
      }),

    // Reject a password reset request
    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        const request = await getPasswordResetRequest(input.id);
        if (!request) {
          throw new Error("Password reset request not found");
        }
        
        await updatePasswordResetRequest(input.id, {
          status: "expired",
        });
        
        await logAudit({
          userId: ctx.user?.id,
          action: "UPDATE",
          entityType: "password_reset_request",
          entityId: input.id,
          description: `Rejected password reset for ${request.email}`,
          status: "success",
        });
        
        return { success: true, message: "Demande rejetee" };
      }),
  }),
});
