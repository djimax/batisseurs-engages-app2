import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { notificationSchedules } from "../drizzle/schema";
import { getOrCreateNotificationPreferences, generateMembershipReminderNotifications } from "./notification-center";
import { sendTransactionalEmail } from "./brevo";
import { logAudit } from "./audit";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";

export async function membershipRemindersHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "database-unavailable" });
    const schedules = await db.select().from(notificationSchedules)
      .where(eq(notificationSchedules.scheduleCronTaskUid, taskUid)).limit(1);
    const schedule = schedules[0];
    if (!schedule) return res.json({ ok: true, skipped: "orphan" });
    if (schedule.isEnabled === 0) return res.json({ ok: true, skipped: "disabled" });

    const result = await generateMembershipReminderNotifications(new Date(), async ({ member, adhesion, kind }) => {
      if (!member.email || !member.userId) return;
      const preferences = await getOrCreateNotificationPreferences(member.userId);
      if (preferences?.emailEnabled === 0) return;
      const label = kind === "overdue" ? "en retard" : "bientôt échue";
      const content = `Bonjour ${member.firstName} ${member.lastName},\n\nVotre adhésion ${adhesion.annee} est ${label}. ${kind === "overdue" ? "Pensez à la renouveler dès que possible." : `Elle arrive à échéance le ${new Date(adhesion.dateExpiration).toLocaleDateString("fr-FR")}.`}\n\nCordialement,\nLes Bâtisseurs Engagés`;
      try {
        const email = await sendTransactionalEmail({ to: { email: member.email, name: `${member.firstName} ${member.lastName}` }, subject: `Rappel d’adhésion — Les Bâtisseurs Engagés`, textContent: content });
        await logAudit({ entityType: "transactional_email", entityId: adhesion.id, entityName: "scheduled_membership_reminder", action: "CREATE", description: `Rappel Brevo envoyé à ${member.email}`, newValue: JSON.stringify({ provider: "brevo", messageId: email.messageId, kind }), status: "success" });
      } catch (error) {
        console.error("[Brevo] Rappel automatique non envoyé", error);
        await logAudit({ entityType: "transactional_email", entityId: adhesion.id, entityName: "scheduled_membership_reminder", action: "CREATE", description: `Échec du rappel Brevo pour ${member.email}`, errorMessage: error instanceof Error ? error.message : "Erreur inconnue", status: "failed" });
      }
    });
    await db.update(notificationSchedules)
      .set({ lastRunAt: new Date().toISOString() })
      .where(eq(notificationSchedules.id, schedule.id));
    return res.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    return res.status(500).json({
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { url: req.originalUrl, taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
