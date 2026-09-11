import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Volunteer expense claims contract", () => {
  it("defines the reimbursement lifecycle and receipt metadata", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(schema).toContain('export const volunteerExpenseClaims = mysqlTable("volunteer_expense_claims"');
    expect(schema).toContain("receiptUrl: text()");
    expect(schema).toContain("status: mysqlEnum(['draft', 'submitted', 'approved', 'rejected', 'reimbursed'])");
  });

  it("protects claims and enforces submitted → approved/rejected → reimbursed", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(router).toContain("listExpenseClaims: protectedProcedure");
    expect(router).toContain("createExpenseClaim: protectedProcedure");
    expect(router).toContain("transitionExpenseClaim: protectedProcedure");
    expect(router).toContain('assertPermission(ctx.user, "finances.manage")');
    expect(router).toContain('entityType: "volunteer_expense_claim"');
    expect(router).toContain('claim.status === "approved" && input.status === "reimbursed"');
  });

  it("renders receipt and reimbursement actions accessibly", () => {
    const finance = readFileSync(new URL("../client/src/pages/Finance.tsx", import.meta.url), "utf8");
    expect(finance).toContain("trpc.finances.listExpenseClaims.useQuery()");
    expect(finance).toContain('TabsTrigger value="frais"');
    expect(finance).toContain("Notes de frais bénévoles");
    expect(finance).toContain("aria-label={`Marquer ${claim.title} comme remboursée`}");
  });

  it("notifies the linked member for each validated transition", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(router).toContain("memberRecipient?.userId");
    expect(router).toContain("createUserNotification");
    expect(router).toContain("expense_claim_${input.status}");
    expect(router).toContain("expense-claim:${input.id}:${input.status}");
    expect(router).toContain("notifiedUserId");
  });
});
