import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("email preview member selector", () => {
  it("uses the members.view permission and returns only preview fields", () => {
    const source = readFileSync(new URL("./email-router.ts", import.meta.url), "utf8");
    expect(source).toContain("previewMembers: protectedProcedure.query");
    expect(source).toContain('assertPermission(ctx.user, "members.view")');
    expect(source).toContain("firstName: member.firstName");
    expect(source).toContain("lastName: member.lastName");
    expect(source).toContain("email: member.email");
    expect(source).not.toContain("phone: member.phone");
    expect(source).not.toContain("address: member.address");
  });

  it("keeps preview data local and avoids invoking the sending mutation", () => {
    const source = readFileSync(new URL("../client/src/pages/EmailComposer.tsx", import.meta.url), "utf8");
    expect(source).toContain("trpc.email.previewMembers.useQuery");
    expect(source).toContain('sandbox=""');
    expect(source).toContain("srcDoc={previewDocument}");
    expect(source).not.toContain("previewMembers.send");
  });
});
