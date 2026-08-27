import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("auth.exportMyData", () => {
  it("expose un export protégé limité aux données du compte", () => {
    expect(routerSource).toContain("exportMyData: protectedProcedure.query");
    expect(routerSource).toContain("eq(documents.createdBy, ctx.user.id)");
    expect(routerSource).toContain("eq(documentNotes.userId, ctx.user.id)");
    expect(routerSource).toContain("eq(auditLogs.userId, ctx.user.id)");
  });

  it("ne sélectionne pas les URLs ou clés privées des fichiers dans l’export", () => {
    const exportBlock = routerSource.split("exportMyData: protectedProcedure.query")[1]?.split("}),\n    logout:")[0] ?? "";
    expect(exportBlock).not.toContain("documents.fileUrl");
    expect(exportBlock).not.toContain("documents.fileKey");
  });
});

