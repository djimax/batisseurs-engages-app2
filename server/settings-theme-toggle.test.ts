import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const settingsPage = readFileSync(resolve(process.cwd(), "client/src/pages/Settings.tsx"), "utf8");

describe("Settings theme toggle contract", () => {
  it("includes explicit buttons for light and dark theme selection", () => {
    expect(settingsPage).toContain('onClick={() => handleThemeChange("light")}');
    expect(settingsPage).toContain('onClick={() => handleThemeChange("dark")}');
    expect(settingsPage).toContain('onClick={() => handleThemeChange("system")}');
    expect(settingsPage).toContain('aria-pressed={theme === "system"}');
    expect(settingsPage).toContain("Mode clair");
    expect(settingsPage).toContain("Mode sombre");
    expect(settingsPage).toContain("Système");
  });
});
