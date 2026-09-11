import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Attendance certification contract", () => {
  it("stores certification status, signer and proof hash on assemblies", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(schema).toContain("attendanceCertificationStatus: mysqlEnum(['uncertified','certified'])");
    expect(schema).toContain("attendanceCertifiedBy: int()");
    expect(schema).toContain("attendanceProofHash: varchar({ length: 128 })");
  });

  it("requires governance permission and freezes certified attendance", () => {
    const router = readFileSync(new URL("./governance-router.ts", import.meta.url), "utf8");
    expect(router).toContain("certifyAttendance: protectedProcedure");
    expect(router).toContain('assertPermission(ctx.user, "governance.manage")');
    expect(router).toContain("attendanceCertificationStatus === \"certified\"");
    expect(router).toContain("Feuille de présence certifiée");
    expect(router).toContain("createHash(\"sha256\")");
  });

  it("renders a live certification state and certification action", () => {
    const page = readFileSync(new URL("../client/src/pages/Governance.tsx", import.meta.url), "utf8");
    expect(page).toContain("Certifier les présences");
    expect(page).toContain('role="status" aria-live="polite"');
    expect(page).toContain("Empreinte");
  });
});
