import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EURO_TO_XOF, buildFinancialReport, convertFinancialAmount } from "./financial";

describe("Configurable EUR/XOF rate", () => {
  it("preserves the reference rate and supports an explicit rate", () => {
    expect(EURO_TO_XOF).toBe(655.957);
    expect(convertFinancialAmount(1, "EUR", "XOF", 700)).toBe(700);
    const report = buildFinancialReport([{ type: "don", amount: 1, currency: "EUR", date: "2026-01-01T00:00:00.000Z" }], 2026, undefined, 700);
    expect(report.total.incomeXof).toBe(700);
  });

  it("exposes and validates the administrative rate", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../client/src/pages/GlobalSettings.tsx", import.meta.url), "utf8");
    expect(schema).toContain("euroToXofRate: varchar({ length: 20 }).default('655.957').notNull()");
    expect(router).toContain("euroToXofRate: z.union([z.string(), z.number()]).optional()");
    expect(router).toContain("parseFinancialAmount(input.euroToXofRate)");
    expect(router).toContain("const euroToXofRate = Number(settings?.euroToXofRate ?? 655.957)");
    expect(page).toContain('id="euroToXofRate"');
    expect(page).toContain("Taux EUR → F CFA");
  });
});
