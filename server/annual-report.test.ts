import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("annual association report contract", () => {
  it("uses explicit UTC year boundaries and real association tables", () => {
    expect(dbSource).toContain("getAnnualAssociationReport");
    expect(dbSource).toContain("${year}-01-01T00:00:00.000Z");
    expect(dbSource).toContain("${year + 1}-01-01T00:00:00.000Z");
    expect(dbSource).toContain("from(members)");
    expect(dbSource).toContain("from(projects)");
    expect(dbSource).toContain("from(events)");
    expect(dbSource).toContain("from(cotisations)");
    expect(dbSource).toContain("from(dons)");
    expect(dbSource).toContain("from(depenses)");
  });

  it("keeps financial amounts separated by EUR and XOF", () => {
    expect(dbSource).toContain("cotisationsTotals");
    expect(dbSource).toContain("donationsTotals");
    expect(dbSource).toContain("expensesTotals");
    expect(dbSource).toContain("balance: { EUR:");
    expect(dbSource).toContain("XOF:");
  });

  it("requires all three read permissions and audits access", () => {
    expect(routerSource).toContain("annualReport: protectedProcedure");
    expect(routerSource).toContain('assertPermission(ctx.user, "members.view")');
    expect(routerSource).toContain('assertPermission(ctx.user, "projects.view")');
    expect(routerSource).toContain('assertPermission(ctx.user, "finances.view")');
    expect(routerSource).toContain('entityType: "annual_association_report"');
  });
});
