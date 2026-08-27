import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("../client/src/pages/AuditHistory.tsx", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("AuditHistory real data contract", () => {
  it("uses the protected tRPC audit query with bounded pagination", () => {
    expect(pageSource).toContain("trpc.admin.getAuditLogs.useQuery({ limit: 500, offset: 0 })");
    expect(routerSource).toContain("getAuditLogs: protectedProcedure");
    expect(routerSource).toContain(".limit(input.limit)");
    expect(routerSource).toContain(".offset(input.offset)");
  });

  it("resolves a missing historical email from the users table", () => {
    expect(routerSource).toContain("leftJoin(users, eq(auditLogs.userId, users.id))");
    expect(routerSource).toContain("COALESCE");
    expect(pageSource).not.toContain("mockLogs");
    expect(pageSource).not.toContain("Simulated data");
  });
});

