import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("notification journal contract", () => {
  it("protects the journal with adminProcedure and supports channels and delivery states", () => {
    expect(routerSource).toContain("journal: adminProcedure");
    expect(routerSource).toContain('z.enum(["all", "in_app", "email"])');
    expect(routerSource).toContain('z.enum(["pending", "sending", "sent", "failed"])');
    expect(routerSource).toContain("emailHistory");
    expect(routerSource).toContain("notifications");
  });

  it("keeps pagination bounded and audits journal access", () => {
    expect(routerSource).toContain("limit: z.number().int().min(1).max(100).default(50)");
    expect(routerSource).toContain("offset: z.number().int().min(0).default(0)");
    expect(routerSource).toContain('entityType: "notification_journal"');
    expect(routerSource).toContain('action: "READ"');
  });

  it("does not claim delivery receipts for in-app notifications", () => {
    expect(routerSource).toContain("status: sql<string>`'created'`");
    expect(routerSource).toContain("dedupeKey: notifications.dedupeKey");
  });
});

