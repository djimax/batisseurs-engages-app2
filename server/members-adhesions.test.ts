import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Adhesions UI data integrity", () => {
  it("uses the protected listWithMembers query instead of hardcoded rows", () => {
    const source = readFileSync(new URL("../client/src/pages/Adhesions.tsx", import.meta.url), "utf8");
    expect(source).toContain("trpc.membersAdhesions.listWithMembers.useQuery");
    expect(source).toContain("storedAdhesions.map");
    expect(source).not.toContain("Placeholder data");
    expect(source).not.toContain('memberName: "Jean Dupont"');
  });
});

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

