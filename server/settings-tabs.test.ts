import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const settingsPage = readFileSync(resolve(process.cwd(), "client/src/pages/Settings.tsx"), "utf8");
const globalStyles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("Settings tabs transition contract", () => {
  it("keeps one animated panel class on each settings tab", () => {
    expect(settingsPage.match(/<TabsContent value=/g)).toHaveLength(4);
    expect(settingsPage.match(/className=\"settings-tab-content space-y-5\"/g)).toHaveLength(4);
  });

  it("defines a short enter animation using the reduced-motion exception", () => {
    expect(globalStyles).toContain("@keyframes settingsTabEnter");
    expect(globalStyles).toContain("settings-tab-content[data-state=\"active\"]");
    expect(globalStyles).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(globalStyles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalStyles).toContain("180ms cubic-bezier(0.23, 1, 0.32, 1)");
  });
});
