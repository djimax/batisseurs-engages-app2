import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSource = readFileSync(resolve(process.cwd(), "client/src/pages/Dashboard.tsx"), "utf8");
const widgetSource = readFileSync(resolve(process.cwd(), "client/src/components/MemberGradesChartWidget.tsx"), "utf8");
const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");

describe("member grades chart integration", () => {
  it("includes gradesBreakdown in getMembersStatistics", () => {
    expect(dbSource).toContain("gradesBreakdown");
    expect(dbSource).toContain("memberGrades.currentGrade");
  });

  it("renders the MemberGradesChartWidget with percentage and grade ladder", () => {
    expect(widgetSource).toContain("Répartition des membres par grade");
    expect(widgetSource).toContain("MEMBER_GRADE_LEVELS");
  });

  it("explains each grade threshold and responsibilities in a tooltip", () => {
    expect(widgetSource).toContain("TooltipTrigger");
    expect(widgetSource).toContain("TooltipContent");
    expect(widgetSource).toContain("minimum {grade.minimumScore}/100");
    expect(widgetSource).toContain("grade.responsibilities");
    expect(widgetSource).toContain("tabIndex={0}");
  });

  it("registers the member grades chart widget in the main dashboard", () => {
    expect(dashboardSource).toContain("member-grades-chart");
    expect(dashboardSource).toContain("MemberGradesChartWidget");
  });
});
