import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Field collection contract", () => {
  it("provides a dedicated authenticated route", () => {
    const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    expect(app).toContain('path="/field-collection"');
    expect(app).toContain("FieldCollection");
  });

  it("persists consented collections locally with explicit statuses", () => {
    const page = readFileSync(new URL("../client/src/pages/FieldCollection.tsx", import.meta.url), "utf8");
    expect(page).toContain("localStorage");
    expect(page).toContain("consent");
    expect(page).toContain("pending");
    expect(page).toContain("Synchroniser");
    expect(page).toContain("hors ligne");
    expect(page).toContain('role="status" aria-live="polite"');
    expect(page).toContain("Journal des actions terrain");
    expect(page).toContain("Filtrer le journal par antenne");
    expect(page).toContain("filteredItems");
  });
});
