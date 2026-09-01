import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const financeSource = readFileSync(new URL("../client/src/pages/Finance.tsx", import.meta.url), "utf8");
const settingsSource = readFileSync(new URL("../client/src/pages/Settings.tsx", import.meta.url), "utf8");

describe("Finance render stability", () => {
  it("exposes the comparative financial report tab and controls", () => {
    expect(financeSource).toContain('value="rapport">Rapport</TabsTrigger>');
    expect(financeSource).toContain('<TabsContent value="rapport"');
    expect(financeSource).toContain("trpc.finances.report.useQuery");
    expect(financeSource).toContain('id="report-year"');
    expect(financeSource).toContain('id="compare-year"');
    expect(financeSource).toContain("Solde");
    expect(financeSource).toContain("exportFinancialReportCsv");
    expect(financeSource).toContain("text/csv;charset=utf-8");
    expect(financeSource).toContain("rapport-financier-");
    expect(financeSource).toContain('(["cotisation", "don", "depense"] as const)');
    expect(financeSource).toContain("item.amountXof");
    expect(financeSource).toContain("item.amountEur");
  });

  it("exposes a dedicated Stripe payments tab in Finance", () => {
    expect(financeSource).toContain('value="paiements">Paiements Stripe</TabsTrigger>');
    expect(financeSource).toContain('<TabsContent value="paiements"');
    expect(financeSource).toContain("<StripeCheckoutCard members={members} />");
  });

  it("offers a direct Stripe entry point from Settings", () => {
    expect(settingsSource).toContain('setLocation("/finance?tab=paiements")');
    expect(settingsSource).toContain("Paiements Stripe");
  });

  it("opens the Stripe tab from a supported Finance URL", () => {
    expect(financeSource).toContain('new URLSearchParams(window.location.search).get("tab")');
    expect(financeSource).toContain('=== "paiements" ? "paiements" : "cotisations"');
  });

  it("uses module-level stable empty arrays for effect-backed financial queries", () => {
    expect(financeSource).toContain("const EMPTY_COTISATIONS: Cotisation[] = [];");
    expect(financeSource).toContain("const EMPTY_DONS: Don[] = [];");
    expect(financeSource).toContain("const EMPTY_DEPENSES: Depense[] = [];");
    expect(financeSource).toContain("storedCotisations = EMPTY_COTISATIONS");
    expect(financeSource).toContain("storedDons = EMPTY_DONS");
    expect(financeSource).toContain("storedDepenses = EMPTY_DEPENSES");
    expect(financeSource).not.toContain("storedCotisations = []");
    expect(financeSource).not.toContain("storedDons = []");
    expect(financeSource).not.toContain("storedDepenses = []");
  });
});
