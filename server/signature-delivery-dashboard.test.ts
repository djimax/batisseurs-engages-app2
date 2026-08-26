import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveSignatureDeliveryStatus } from "./db";

describe("signature delivery dashboard", () => {
  it("maps audit events to stable delivery statuses", () => {
    expect(resolveSignatureDeliveryStatus("EMAIL_SENT", "completed")).toBe("sent");
    expect(resolveSignatureDeliveryStatus("EMAIL_FAILED", "completed")).toBe("failed");
    expect(resolveSignatureDeliveryStatus("EMAIL_SKIPPED", "completed")).toBe("skipped");
    expect(resolveSignatureDeliveryStatus(undefined, "completed")).toBe("pending");
    expect(resolveSignatureDeliveryStatus(undefined, "partially-signed")).toBe("not-ready");
  });

  it("protects the delivery aggregate with the signatures.view permission", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain("signatureDelivery");
    expect(source).toContain('assertPermission(ctx.user, "signatures.view")');
  });

  it("exposes the status vocabulary in the dashboard UI", () => {
    const source = readFileSync(new URL("../client/src/pages/Dashboard.tsx", import.meta.url), "utf8");
    expect(source).toContain("Livraison des PDF signés");
    expect(source).toContain("Envoyé");
    expect(source).toContain("Échec");
    expect(source).toContain("Refusé");
    expect(source).toContain("En attente");
  });
});
