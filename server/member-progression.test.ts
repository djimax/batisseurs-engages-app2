import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canAssignMemberGrade,
  getMemberGradeLevel,
  MEMBER_GRADE_LEVELS,
} from "../shared/memberProgression";

const membersPage = readFileSync(resolve(process.cwd(), "client/src/pages/Members.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");

describe("member progression rules", () => {
  it("exposes an ordered grade ladder with increasing responsibility", () => {
    expect(MEMBER_GRADE_LEVELS.length).toBeGreaterThanOrEqual(4);
    expect(MEMBER_GRADE_LEVELS[0].minimumScore).toBe(0);
    expect(MEMBER_GRADE_LEVELS.at(-1)?.minimumScore).toBeGreaterThan(MEMBER_GRADE_LEVELS[0].minimumScore);
  });

  it("accepts a score only when it reaches the selected grade threshold", () => {
    expect(canAssignMemberGrade(75, "team_lead")).toBe(true);
    expect(canAssignMemberGrade(74, "team_lead")).toBe(false);
    expect(canAssignMemberGrade(92, "regional_referent")).toBe(true);
  });

  it("falls back safely for an unknown grade label", () => {
    expect(getMemberGradeLevel("unknown").value).toBe("member");
  });

  it("keeps the evaluation flow traceable and permission-protected", () => {
    expect(routerSource).toContain("evaluateAndPromote: protectedProcedure");
    expect(routerSource).toContain('assertPermission(ctx.user, "members.manage")');
    expect(routerSource).toContain('action: "PROMOTE"');
    expect(schemaSource).toContain("export const memberEvaluations");
    expect(schemaSource).toContain("export const memberGrades");
  });

  it("provides an admin entry point and a mandatory justification in the UI", () => {
    expect(membersPage).toContain("Évaluer / promouvoir");
    expect(membersPage).toContain("Justification de l’évaluation *");
    expect(membersPage).toContain("Enregistrer la progression");
  });
});
