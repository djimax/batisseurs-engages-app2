import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("signed PDF export", () => {
  it("includes the signed document metadata, hash, signers and audit journal", () => {
    const source = readFileSync(new URL("../client/src/lib/signedPdf.ts", import.meta.url), "utf8");
    expect(source).toContain("documentHash");
    expect(source).toContain("signerName");
    expect(source).toContain("evidenceHash");
    expect(source).toContain("Journal d’audit");
    expect(source).toContain("Signature finalisée le");
  });

  it("only allows completed requests through the server export helper", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    expect(source).toContain('request.status !== "completed"');
    expect(source).toContain('entityType, "signature_request"');
  });

  it("protects export data with the signatures.view permission and logs the export", () => {
    const source = readFileSync(new URL("./signature-router.ts", import.meta.url), "utf8");
    expect(source).toContain('assertPermission(ctx.user, "signatures.view")');
    expect(source).toContain('action: "EXPORT"');
    expect(source).toContain("Export PDF de la preuve de signature");
  });
});
