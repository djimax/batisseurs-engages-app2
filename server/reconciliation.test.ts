import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Bank reconciliation contract", () => {
  it("defines an idempotent reconciliation table", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(schema).toContain('export const bankReconciliations = mysqlTable("bank_reconciliations"');
    expect(schema).toContain('uniqueIndex("bank_reconciliations_external_ref_unique")');
    expect(schema).toContain("status: mysqlEnum(['unmatched','matched','ignored'])");
  });

  it("protects import, listing and matching with financial permissions and audit", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(router).toContain("listReconciliations: protectedProcedure");
    expect(router).toContain("importReconciliation: protectedProcedure");
    expect(router).toContain("matchReconciliation: protectedProcedure");
    expect(router).toContain('assertPermission(ctx.user, "finances.view")');
    expect(router).toContain('assertPermission(ctx.user, "finances.manage")');
    expect(router).toContain('entityType: "bank_reconciliation"');
    expect(router).toContain("if (existing[0]) return existing[0]");
  });

  it("renders an accessible pending reconciliation view", () => {
    const finance = readFileSync(new URL("../client/src/pages/Finance.tsx", import.meta.url), "utf8");
    expect(finance).toContain("trpc.finances.listReconciliations.useQuery");
    expect(finance).toContain('TabsTrigger value="rapprochement"');
    expect(finance).toContain("Rapprochement des paiements");
    expect(finance).toContain("aria-label={`Marquer ${row.externalReference} comme rapproché`}");
  });
});
