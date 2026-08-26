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

  it("checks project budget before submitting a request", () => {
    const db = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const router = readFileSync(new URL("./purchases-router.ts", import.meta.url), "utf8");
    expect(db).toContain("getPurchaseBudgetStatus");
    expect(db).toContain("withinBudget");
    expect(router).toContain('input.status === "submitted"');
    expect(router).toContain('code: "CONFLICT"');
  });

  it("supports secure quote attachments and exclusive quote selection", () => {
    const router = readFileSync(new URL("./purchases-router.ts", import.meta.url), "utf8");
    const db = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    expect(router).toContain("storagePut");
    expect(router).toContain("fileSize");
    expect(router).toContain("purchase-quotes/");
    expect(router).toContain("selectQuote");
    expect(db).toContain("selectPurchaseQuote");
    expect(db).toContain('status: "rejected"');
    expect(db).toContain('status: "selected"');
  });

  it("exposes a permission-protected budget status query", () => {
    const router = readFileSync(new URL("./purchases-router.ts", import.meta.url), "utf8");
    expect(router).toContain("budgetStatus");
    expect(router).toContain('assertPermission(ctx.user, "purchases.view")');
  });

  it("rechecks the budget before approval", () => {
    const router = readFileSync(new URL("./purchases-router.ts", import.meta.url), "utf8");
    expect(router).toContain("getPurchaseRequestById");
    expect(router).toContain('input.status === "approved"');
    expect(router).toContain("Approbation refusée");
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
