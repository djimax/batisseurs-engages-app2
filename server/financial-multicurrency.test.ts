import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EURO_TO_XOF, buildDonationDocumentHtml, convertFinancialAmount, formatFinancialAmount, parseFinancialAmount } from "./financial";

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
