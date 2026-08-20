import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");

describe("MySQL/TiDB boolean column compatibility", () => {
  it("does not use tinyint declarations in the active Drizzle schema", () => {
    expect(schemaSource).not.toMatch(/tinyint\s*\(/i);
    expect(schemaSource).not.toMatch(/tinyint\s*\(\s*['\"]1['\"]\s*\)/i);
  });

  it("keeps active boolean-like flags on integer columns", () => {
    const booleanFlags = ["isActive", "isArchived", "isSystem", "isRead", "isEnabled"];

    for (const flag of booleanFlags) {
      expect(schemaSource).toMatch(new RegExp(`${flag}\\s*:\\s*int\\s*\\(`));
    }
  });
});
