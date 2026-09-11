import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("membership reminder administration contract", () => {
  const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

  it("exposes a read-only schedule status protected by finance view permission", () => {
    expect(source).toContain("getMembershipReminderSchedule: protectedProcedure.query");
    expect(source).toContain('assertPermission(ctx.user, "finances.view")');
    expect(source).toContain('eq(notificationSchedules.name, "membership-reminders")');
  });

  it("audits manual reminder generation with its deterministic result", () => {
    expect(source).toContain('entityType: "membership_reminder_run"');
    expect(source).toContain("newValue: JSON.stringify(result)");
    expect(source).toContain("generateMembershipReminderNotifications()");
  });

  it("accepts the documented six-field UTC cron format", () => {
    expect(source).toContain("regex(/^\\d+ \\d+ \\d+ \\* \\* \\*$/)");
    expect(source).toContain('default("0 0 9 * * *")');
  });
});
