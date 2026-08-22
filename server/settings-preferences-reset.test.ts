import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PREFERENCES, resetStoredPreferences } from "../client/src/hooks/usePreferences";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };
}

describe("resetStoredPreferences", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  it("persists a fresh copy of every default preference", () => {
    localStorage.setItem("userPreferences", JSON.stringify({ language: "en", theme: "dark", itemsPerPage: 50 }));

    const result = resetStoredPreferences();

    expect(result).toEqual(DEFAULT_PREFERENCES);
    expect(JSON.parse(localStorage.getItem("userPreferences")!)).toEqual(DEFAULT_PREFERENCES);
  });

  it("does not touch unrelated local application data", () => {
    localStorage.setItem("batisseurs_documents", JSON.stringify([{ id: 1 }]));
    localStorage.setItem("batisseurs_members", JSON.stringify([{ id: 2 }]));

    resetStoredPreferences();

    expect(localStorage.getItem("batisseurs_documents")).toContain('"id":1');
    expect(localStorage.getItem("batisseurs_members")).toContain('"id":2');
  });
});
