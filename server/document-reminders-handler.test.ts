import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("document reminders handler", () => {
  it("is mounted on the required scheduled path", () => {
    const source = readFileSync(new URL("./document-reminders-handler.ts", import.meta.url), "utf8");
    const server = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");
    expect(server).toContain('app.post("/api/scheduled/document-reminders", documentRemindersHandler)');
    expect(source).toContain("user.isCron");
    expect(source).toContain("user.taskUid");
  });

  it("looks up the schedule by task uid and skips recent reminders", () => {
    const source = readFileSync(new URL("./document-reminders-handler.ts", import.meta.url), "utf8");
    expect(source).toContain("scheduleCronTaskUid");
    expect(source).toContain('auditLogs.action, "REMINDER"');
    expect(source).toContain("REMINDER_COOLDOWN_DAYS");
    expect(source).toContain("skipped: \"orphan\"");
  });

  it("limits reminders to active documents with a due date in the horizon", () => {
    const source = readFileSync(new URL("./document-reminders-handler.ts", import.meta.url), "utf8");
    expect(source).toContain("documents.dueDate");
    expect(source).toContain("documents.isArchived");
    expect(source).toContain("REMINDER_WINDOW_DAYS");
    expect(source).toContain("sendTransactionalEmail");
    expect(source).toContain('action: "REMINDER"');
  });
});
