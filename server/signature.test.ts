import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDocumentIntegrityHash } from "./db";

describe("electronic signature workflow", () => {
  it("creates a stable integrity hash for the same document version", () => {
    const document = { id: 42, title: "Statuts", fileKey: "documents/42/file.pdf", updatedAt: "2026-08-26T12:00:00.000Z" };
    expect(buildDocumentIntegrityHash(document)).toBe(buildDocumentIntegrityHash(document));
    expect(buildDocumentIntegrityHash(document)).toHaveLength(64);
    expect(buildDocumentIntegrityHash(document)).not.toBe(buildDocumentIntegrityHash({ ...document, fileKey: "documents/42/other.pdf" }));
  });

  it("protects management, viewing and signing with dedicated permissions", () => {
    const source = readFileSync(new URL("./signature-router.ts", import.meta.url), "utf8");
    expect(source).toContain('assertPermission(ctx.user, "signatures.manage")');
    expect(source).toContain('assertPermission(ctx.user, "signatures.view")');
    expect(source).toContain('assertPermission(ctx.user, "signatures.sign")');
    expect(source).toContain("consent: z.literal(true)");
    expect(source).toContain("evidenceHash");
  });

  it("records only an integrity proof and typed signature, not raw secrets", () => {
    const source = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(source).toContain("evidenceHash: varchar({ length: 128 })");
    expect(source).toContain("typedSignature: varchar({ length: 255 })");
    expect(source).not.toContain("signatureImage: blob");
  });
});
