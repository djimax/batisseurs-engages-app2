import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EURO_TO_XOF, buildDonationDocumentHtml, buildFinancialReport, convertFinancialAmount, formatFinancialAmount, parseFinancialAmount } from "./financial";

describe("Financial multi-currency helpers", () => {
  it("parses and rounds positive amounts", () => {
    expect(parseFinancialAmount("1 234,567")).toBe(1234.57);
    expect(parseFinancialAmount(10)).toBe(10);
  });

  it("rejects invalid or non-positive amounts", () => {
    expect(() => parseFinancialAmount("0")).toThrow("nombre positif");
    expect(() => parseFinancialAmount("not-a-number")).toThrow("nombre positif");
  });

  it("converts both ways using the reference EUR/XOF rate", () => {
    expect(convertFinancialAmount(100, "EUR", "XOF")).toBe(65595.7);
    expect(convertFinancialAmount(65595.7, "XOF", "EUR")).toBe(100);
    expect(EURO_TO_XOF).toBe(655.957);
  });

  it("formats each currency with an explicit symbol", () => {
    expect(formatFinancialAmount(12.5, "EUR")).toContain("€");
    expect(formatFinancialAmount(65595.7, "XOF")).toContain("F CFA");
  });

  it("audits financial and annual membership mutations centrally", () => {
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const adhesionSource = readFileSync(new URL("./members-adhesions-router.ts", import.meta.url), "utf8");
    expect(routerSource).toContain('entityType: "membership_fee_rule"');
    expect(routerSource).toContain('entityType: "cotisation"');
    expect(routerSource).toContain('entityType: "don"');
    expect(routerSource).toContain('entityType: "depense"');
    expect(adhesionSource).toContain('action: "CREATE"');
    expect(adhesionSource).toContain('action: "RENEW"');
  });

  it("exposes the protected comparative report procedure", () => {
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routerSource).toContain("report: protectedProcedure");
    expect(routerSource).toContain('assertPermission(ctx.user, "finances.view")');
    expect(routerSource).toContain("compareYear");
    const financePageSource = readFileSync(new URL("../client/src/pages/Finance.tsx", import.meta.url), "utf8");
    expect(financePageSource).toContain("trpc.finances.analyticReport.useQuery()");
    expect(financePageSource).toContain('TabsTrigger value="analytique"');
    expect(financePageSource).toContain("Ventilation analytique");
    expect(routerSource).toContain("buildFinancialReport");
    expect(routerSource).toContain("analyticReport: protectedProcedure");
    expect(routerSource).toContain('assertPermission(ctx.user, "finances.view")');
  });

  it("builds a monthly report with EUR/XOF equivalences and annual comparison", () => {
    const entries = [
      { type: "cotisation" as const, amount: 100, currency: "EUR" as const, date: "2026-01-05T00:00:00.000Z" },
      { type: "don" as const, amount: 65595.7, currency: "XOF" as const, date: "2026-01-20T00:00:00.000Z" },
      { type: "depense" as const, amount: 50, currency: "EUR" as const, date: "2026-01-25T00:00:00.000Z" },
      { type: "cotisation" as const, amount: 100, currency: "EUR" as const, date: "2025-01-05T00:00:00.000Z" },
    ];
    const report = buildFinancialReport(entries, 2026, 2025);
    expect(report.monthly).toHaveLength(1);
    expect(report.total.incomeEur).toBe(200);
    expect(report.total.expensesEur).toBe(50);
    expect(report.total.balanceEur).toBe(150);
    expect(report.total.balanceXof).toBe(98393.55);
    expect(report.breakdown.cotisation.amountEur).toBe(100);
    expect(report.breakdown.don.amountXof).toBe(65595.7);
    expect(report.breakdown.depense.amountEur).toBe(50);
    expect(report.comparison).toEqual({ year: 2025, totalXof: 65595.7, totalEur: 100, variationXof: 50, variationEur: 50 });
  });

  it("builds a printable donation document with original and equivalent amounts", () => {
    const html = buildDonationDocumentHtml({
      documentTitle: "Reçu fiscal de don",
      receiptNumber: "RFD-2026-TEST",
      donorName: "Donateur Test",
      donorEmail: "test@example.org",
      amount: 100,
      currency: "EUR",
      donationDate: "2026-08-21T12:00:00.000Z",
      associationName: "Les Bâtisseurs Engagés",
    });

    expect(html).toContain("RFD-2026-TEST");
    expect(html).toContain("Donateur Test");
    expect(html).toContain("F CFA");
    expect(html).toContain("conditions fiscales applicables");
  });
});
