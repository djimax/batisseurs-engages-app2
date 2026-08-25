import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const financeSource = readFileSync(new URL("../client/src/pages/Finance.tsx", import.meta.url), "utf8");

describe("Finance render stability", () => {
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
