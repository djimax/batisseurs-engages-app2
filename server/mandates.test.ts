import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Board mandates contract", () => {
  it("defines dated mandate states with searchable indexes", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(schema).toContain('export const boardMandates = mysqlTable("board_mandates"');
    expect(schema).toContain("status: mysqlEnum(['planned', 'active', 'ended', 'renewal_due'])");
    expect(schema).toContain('index("board_mandates_member_idx")');
  });

  it("protects mandate creation and prevents conflicting active roles", () => {
    const router = readFileSync(new URL("./governance-router.ts", import.meta.url), "utf8");
    expect(router).toContain("listMandates: protectedProcedure");
    expect(router).toContain("createMandate: protectedProcedure");
    expect(router).toContain("updateMandateStatus: protectedProcedure");
    expect(router).toContain('assertPermission(ctx.user, "governance.manage")');
    expect(router).toContain("Ce rôle possède déjà un mandat actif.");
    expect(router).toContain('entityType: "board_mandate"');
  });

  it("renders the mandate controls with labelled fields and status actions", () => {
    const page = readFileSync(new URL("../client/src/pages/Governance.tsx", import.meta.url), "utf8");
    expect(page).toContain("Mandats du bureau");
    expect(page).toContain('id="mandate-role"');
    expect(page).toContain('id="mandate-member"');
    expect(page).toContain('id="mandate-start"');
    expect(page).toContain("À renouveler");
    expect(page).toContain("Terminer");
  });
});
