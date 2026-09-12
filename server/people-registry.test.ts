import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("People compliance registry contract", () => {
  it("protects the registry with members.view and filters controlled statuses", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(router).toContain("complianceRegistry: protectedProcedure");
    expect(router).toContain('assertPermission(ctx.user, "members.view")');
    expect(router).toContain('personType: z.enum(["benevole", "responsable"])');
    expect(router).toContain('status: z.enum(["active", "inactive", "pending", "suspended", "resigned", "deceased", "archived"])');
  });

  it("renders labelled filters and protected contact columns", () => {
    const page = readFileSync(new URL("../client/src/pages/PeopleRegistry.tsx", import.meta.url), "utf8");
    const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    expect(page).toContain("Registre du personnel et des bénévoles");
    expect(page).toContain('id="registry-search"');
    expect(page).toContain('id="registry-status"');
    expect(page).toContain('id="registry-type"');
    expect(page).toContain("Les coordonnées sont affichées uniquement dans cet espace protégé.");
    expect(page).toContain("ViewModeToggle");
    expect(page).toContain("Annuaire numéroté des personnes enregistrées");
    expect(page).toContain("index + 1");
    expect(app).toContain('path="/people-registry" component={PeopleRegistry}');
  });
});
