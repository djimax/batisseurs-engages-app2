import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStoredTheme } from "../client/src/contexts/ThemeContext";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
}

describe("ThemeContext storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  it("prioritizes the theme stored with user preferences", () => {
    localStorage.setItem("theme", "light");
    localStorage.setItem("userPreferences", JSON.stringify({ theme: "dark" }));

    expect(getStoredTheme("light")).toBe("dark");
  });

  it("falls back to the legacy theme key", () => {
    localStorage.setItem("theme", "dark");

    expect(getStoredTheme("light")).toBe("dark");
  });

  it("uses the default theme for invalid stored values", () => {
    localStorage.setItem("theme", "unknown");
    localStorage.setItem("userPreferences", "not-json");

    expect(getStoredTheme("light")).toBe("light");
  });
});
