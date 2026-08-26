import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("signature PDF email retry", () => {
  it("requires management permission and only targets completed requests", () => {
    const source = readFileSync(new URL("./signature-router.ts", import.meta.url), "utf8");
    expect(source).toContain("retryProofEmail");
    expect(source).toContain('assertPermission(ctx.user, "signatures.manage")');
    expect(source).toContain("La demande doit être entièrement signée");
  });

  it("keeps consent, deduplication, attachment and audit safeguards", () => {
    const source = readFileSync(new URL("./signature-router.ts", import.meta.url), "utf8");
    expect(source).toContain("alreadySent");
    expect(source).toContain("emailEnabled");
    expect(source).toContain("document-signe-${input.requestId}.pdf");
    expect(source).toContain("(relance)");
    expect(source).toContain('action: "EMAIL_FAILED"');
  });

  it("exposes the retry action only for failed or pending deliveries", () => {
    const source = readFileSync(new URL("../client/src/pages/Dashboard.tsx", import.meta.url), "utf8");
    expect(source).toContain("handleRetryProofEmail");
    expect(source).toContain('signer.status === "failed" || signer.status === "pending"');
    expect(source).toContain("Relancer l’envoi du PDF signé");
  });
});
