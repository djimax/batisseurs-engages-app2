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

describe("Field collection queue resilience", () => {
  it("defines explicit queue states and retries pending/error records", () => {
    const page = readFileSync(new URL("../client/src/pages/FieldCollection.tsx", import.meta.url), "utf8");
    expect(page).toContain('"pending" | "syncing" | "synced" | "error"');
    expect(page).toContain('item.status === "pending" || item.status === "error"');
    expect(page).toContain('status: "syncing"');
    expect(page).toContain('status: "synced"');
  });

  it("prevents duplicate local records and exposes accessible status labels", () => {
    const page = readFileSync(new URL("../client/src/pages/FieldCollection.tsx", import.meta.url), "utf8");
    expect(page).toContain("Ce relevé existe déjà dans la file locale.");
    expect(page).toContain("Synchronisation…");
    expect(page).toContain("À reprendre");
    expect(page).toContain('aria-live="polite"');
  });
});
