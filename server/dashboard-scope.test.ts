import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/pages/Dashboard.tsx", import.meta.url), "utf8");

describe("dashboard scope contract", () => {
  it("exposes only the authenticated user's scope grants", () => {
    expect(routerSource).toContain("myScopes: protectedProcedure");
    expect(routerSource).toContain("getUserScopeGrants(ctx.user.id)");
    expect(routerSource).toContain("isNational");
  });

  it("communicates national, antenna and missing-scope states", () => {
    expect(dashboardSource).toContain("Périmètre :");
    expect(dashboardSource).toContain("National");
    expect(dashboardSource).toContain("Non attribué");
    expect(dashboardSource).toContain("antenne(s)");
  });
});
