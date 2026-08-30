import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("members adhesions authorization", () => {
  it("protects reads and writes with member permissions", () => {
    const source = readFileSync(new URL("./members-adhesions-router.ts", import.meta.url), "utf8");
    expect(source).toContain('assertPermission(ctx.user, "members.view")');
    expect(source).toContain('assertPermission(ctx.user, "members.manage")');
  });

  it("keeps audit entries for adhesion creation and renewal", () => {
    const source = readFileSync(new URL("./members-adhesions-router.ts", import.meta.url), "utf8");
    expect(source).toContain('entityType: "adhesion"');
    expect(source).toContain('action: "CREATE"');
    expect(source).toContain('action: "RENEW"');
  });
});

