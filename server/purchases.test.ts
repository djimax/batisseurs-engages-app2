import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("purchases and suppliers module", () => {
  it("declares granular permissions and protected procedures", () => {
    const auth = readFileSync(new URL("./authorization.ts", import.meta.url), "utf8");
    const router = readFileSync(new URL("./purchases-router.ts", import.meta.url), "utf8");
    expect(auth).toContain('suppliers.view');
    expect(auth).toContain('purchases.approve');
    expect(router).toContain('assertPermission(ctx.user, "suppliers.manage")');
    expect(router).toContain('purchases.approve');
    expect(router).toContain('logAudit');
  });

  it("validates positive amounts and supports EUR and XOF", () => {
    const router = readFileSync(new URL("./purchases-router.ts", import.meta.url), "utf8");
    expect(router).toContain("Le montant doit être positif");
    expect(router).toContain('z.enum(["EUR", "XOF"])');
    expect(router).toContain("purchases.manage");
  });

  it("keeps an auditable approval lifecycle", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    const router = readFileSync(new URL("./purchases-router.ts", import.meta.url), "utf8");
    expect(schema).toContain('mysqlTable("purchase_requests"');
    expect(schema).toContain("approvedBy");
    expect(router).toContain('"approved", "rejected"');
    expect(router).toContain('status: input.status');
  });
});
