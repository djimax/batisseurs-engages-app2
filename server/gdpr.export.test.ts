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


describe("RGPD deletion request contract", () => {
  it("requires authentication and prevents duplicate pending requests", () => {
    expect(routerSource).toContain("requestDataDeletion: protectedProcedure");
    expect(routerSource).toContain("eq(dataDeletionRequests.userId, ctx.user.id)");
    expect(routerSource).toContain("eq(dataDeletionRequests.status, \"pending\")");
    expect(routerSource).toContain("code: \"CONFLICT\"");
  });

  it("limits review actions to admins with audit logging", () => {
    expect(routerSource).toContain("listDataDeletionRequests: protectedProcedure");
    expect(routerSource).toContain("reviewDataDeletionRequest: protectedProcedure");
    expect(routerSource).toContain("assertPermission(ctx.user, \"admin.audit.view\")");
    expect(routerSource).toContain("entityType: \"data_deletion_request\"");
    expect(routerSource).toContain("Cette demande a déjà été traitée");
  });
});
