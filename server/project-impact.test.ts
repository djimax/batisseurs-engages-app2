import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Project impact indicators contract", () => {
  it("defines a project-scoped indicator table with measurable values and period indexes", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(schema).toContain('export const projectImpactIndicators = mysqlTable("project_impact_indicators"');
    expect(schema).toContain("projectId: int().notNull()");
    expect(schema).toContain("currentValue: varchar({ length: 30 }).notNull()");
    expect(schema).toContain("targetValue: varchar({ length: 30 })");
    expect(schema).toContain('index("project_impact_indicators_project_idx")');
  });

  it("protects reads and mutations and records create/update/delete audit events", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const projectBlock = router.slice(router.indexOf("projects: router({"), router.indexOf("projects: router({") + 18000);
    expect(projectBlock).toContain("getImpactIndicators: protectedProcedure");
    expect(projectBlock).toContain("createImpactIndicator: protectedProcedure");
    expect(projectBlock).toContain("updateImpactIndicator: protectedProcedure");
    expect(projectBlock).toContain("deleteImpactIndicator: protectedProcedure");
    expect(projectBlock).toContain('assertPermission(ctx.user, "projects.view")');
    expect(projectBlock).toContain('assertPermission(ctx.user, "projects.manage")');
    expect(projectBlock).toContain('entityType: "project_impact_indicator"');
    expect(projectBlock).toContain('action: "CREATE"');
    expect(projectBlock).toContain('action: "UPDATE"');
    expect(projectBlock).toContain('action: "DELETE"');
  });

  it("renders an accessible impact tab with target progress and empty state", () => {
    const page = readFileSync(new URL("../client/src/pages/ProjectDetail.tsx", import.meta.url), "utf8");
    expect(page).toContain('<TabsTrigger value="impact">Impact</TabsTrigger>');
    expect(page).toContain("trpc.projects.getImpactIndicators.useQuery");
    expect(page).toContain("role=\"progressbar\"");
    expect(page).toContain("Aucun indicateur d’impact");
    expect(page).toContain("aria-label={`Supprimer ${indicator.name}`}");
  });
});
