import type { Request, Response } from "express";
import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { auditLogs, documents, notificationSchedules, users } from "../drizzle/schema";
import { getDb } from "./db";
import { logAudit } from "./audit";
import { sendTransactionalEmail } from "./brevo";
import { sdk } from "./_core/sdk";

const REMINDER_WINDOW_DAYS = 30;
const REMINDER_COOLDOWN_DAYS = 7;

export async function documentRemindersHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    taskUid = user.taskUid;
    if (!user.isCron || !taskUid) return res.status(403).json({ error: "cron-only" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "database-unavailable" });
    const schedule = (await db.select().from(notificationSchedules)
      .where(eq(notificationSchedules.scheduleCronTaskUid, taskUid)).limit(1))[0];
    if (!schedule) return res.json({ ok: true, skipped: "orphan" });
    if (schedule.isEnabled === 0) return res.json({ ok: true, skipped: "disabled" });

    const now = new Date();
    const horizon = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const cooldown = new Date(now.getTime() - REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const candidates = await db.select({ document: documents, recipient: users })
      .from(documents)
      .leftJoin(users, eq(documents.createdBy, users.id))
      .where(and(
        isNotNull(documents.dueDate),
        gte(documents.dueDate, now.toISOString()),
        lte(documents.dueDate, horizon.toISOString()),
        eq(documents.isArchived, 0),
      ));

    let sent = 0;
    let skipped = 0;
    for (const candidate of candidates) {
      const document = candidate.document;
      const recipient = candidate.recipient;
      if (!document.dueDate || !recipient?.email) { skipped++; continue; }
      const recent = await db.select({ id: auditLogs.id }).from(auditLogs).where(and(
        eq(auditLogs.entityType, "document"),
        eq(auditLogs.entityId, document.id),
        eq(auditLogs.action, "REMINDER"),
        eq(auditLogs.status, "success"),
        gte(auditLogs.createdAt, cooldown.toISOString()),
      )).limit(1);
      if (recent.length > 0) { skipped++; continue; }
      try {
        await sendTransactionalEmail({
          to: { email: recipient.email, name: recipient.name ?? undefined },
          subject: `Échéance documentaire — ${document.title}`,
          textContent: `Bonjour${recipient.name ? ` ${recipient.name}` : ""},\n\nLe document « ${document.title} » arrive à échéance le ${new Date(document.dueDate).toLocaleDateString("fr-FR")}. Merci de vérifier son renouvellement ou sa finalisation.\n\nLes Bâtisseurs Engagés`,
        });
        await logAudit({ entityType: "document", entityId: document.id, entityName: "document_due_date", action: "REMINDER", description: `Rappel d’échéance envoyé à ${recipient.email}`, newValue: JSON.stringify({ dueDate: document.dueDate, windowDays: REMINDER_WINDOW_DAYS }), status: "success" });
        sent++;
      } catch (error) {
        await logAudit({ entityType: "document", entityId: document.id, entityName: "document_due_date", action: "REMINDER", description: `Échec du rappel d’échéance pour ${recipient.email}`, errorMessage: error instanceof Error ? error.message : "Erreur inconnue", status: "failed" });
      }
    }
    await db.update(notificationSchedules).set({ lastRunAt: now.toISOString() }).where(eq(notificationSchedules.id, schedule.id));
    return res.json({ ok: true, candidates: candidates.length, sent, skipped });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown-error";
    return res.status(500).json({ error: message, stack: error instanceof Error ? error.stack : undefined, context: { url: req.originalUrl, taskUid }, timestamp: new Date().toISOString() });
  }
}
