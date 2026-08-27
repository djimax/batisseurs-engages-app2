import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const criticalRouters = [
  "routers.ts",
  "purchases-router.ts",
  "governance-router.ts",
  "signature-router.ts",
  "stripe-router.ts",
  "stripe-webhook.ts",
];

describe("couverture contractuelle de l’audit des modules critiques", () => {
  it("conserve un appel logAudit dans chaque flux critique", () => {
    for (const routerFile of criticalRouters) {
      const source = readFileSync(new URL(`./${routerFile}`, import.meta.url), "utf8");
      expect(source, routerFile).toContain("logAudit");
    }
  });

  it("conserve les états d’échec dans les flux externes sensibles", () => {
    const stripeSource = readFileSync(new URL("./stripe-webhook.ts", import.meta.url), "utf8");
    const signatureSource = readFileSync(new URL("./signature-router.ts", import.meta.url), "utf8");
    expect(stripeSource).toContain('status: "failed"');
    expect(signatureSource).toContain('action: "EMAIL_FAILED"');
  });
});
