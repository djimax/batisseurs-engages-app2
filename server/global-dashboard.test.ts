import { describe, expect, it } from "vitest";
import { getGlobalDashboardSummary } from "./db";

describe("Global dashboard summary", () => {
  it("returns real cross-module sections with stable shapes", async () => {
    const summary = await getGlobalDashboardSummary();

    expect(summary).toMatchObject({
      documents: expect.objectContaining({ total: expect.any(Number), completed: expect.any(Number) }),
      members: expect.objectContaining({ total: expect.any(Number) }),
      projects: expect.objectContaining({ total: expect.any(Number) }),
      tasks: expect.objectContaining({ total: expect.any(Number), overdue: expect.any(Number) }),
      finance: expect.objectContaining({ balance: expect.anything() }),
      campaigns: expect.objectContaining({ active: expect.any(Number), total: expect.any(Number) }),
      adhesions: expect.objectContaining({ active: expect.any(Number), expired: expect.any(Number), pending: expect.any(Number) }),
      onboarding: expect.objectContaining({ steps: expect.any(Array), completed: expect.any(Number), total: expect.any(Number), percentage: expect.any(Number) }),
      institution: expect.objectContaining({ name: expect.any(String) }),
    });
    expect(Array.isArray(summary.recentPayments)).toBe(true);
    expect(Array.isArray(summary.activity.urgentTasks)).toBe(true);
    expect(Array.isArray(summary.activity.activeProjects)).toBe(true);
    expect("rib" in summary.institution).toBe(false);
  });

  it("keeps onboarding and campaign percentages within presentation bounds", async () => {
    const summary = await getGlobalDashboardSummary();

    expect(summary.onboarding.completed).toBeGreaterThanOrEqual(0);
    expect(summary.onboarding.completed).toBeLessThanOrEqual(summary.onboarding.total);
    expect(summary.onboarding.percentage).toBeGreaterThanOrEqual(0);
    expect(summary.onboarding.percentage).toBeLessThanOrEqual(100);
    expect(summary.campaigns.activeProgress).toBeGreaterThanOrEqual(0);
    expect(summary.campaigns.activeProgress).toBeLessThanOrEqual(100);
  });
});
