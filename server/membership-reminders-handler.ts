import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { notificationSchedules } from "../drizzle/schema";
import { getDb } from "./db";
import { generateMembershipReminderNotifications } from "./notification-center";
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

    const result = await generateMembershipReminderNotifications();
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
