import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const settingsPage = readFileSync(resolve(process.cwd(), "client/src/pages/Settings.tsx"), "utf8");

describe("Settings reset success toast", () => {
  it("keeps an explicit short success notification after the reset handler", () => {
    expect(settingsPage).toContain('toast.success("Préférences réinitialisées"');
    expect(settingsPage).toContain('description: "Vos choix personnels sont revenus aux valeurs par défaut."');
    expect(settingsPage).toContain("duration: 2200");
  });
});
