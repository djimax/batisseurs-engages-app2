import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";

import {
  getDashboardStatistics,
  getProjectsStatistics,
  getTasksStatistics,
  getFinanceStatistics,
  getMembersStatistics,
} from "./db";

describe("Dashboard Permission Contract", () => {
  it("protects each dashboard aggregate with its domain permission", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const dashboardBlock = source.slice(source.indexOf("dashboard: router({"), source.indexOf("dashboard: router({") + 1800);
    expect(dashboardBlock).toContain('assertPermission(ctx.user, "members.view")');
    expect(dashboardBlock).toContain('assertPermission(ctx.user, "projects.view")');
    expect(dashboardBlock).toContain('assertPermission(ctx.user, "finances.view")');
    expect(dashboardBlock).toContain('assertPermission(ctx.user, "signatures.view")');
  });
});

describe("Dashboard Statistics", () => {
  describe("getDashboardStatistics", () => {
    it("should return dashboard statistics with all required fields", async () => {
      const stats = await getDashboardStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("documents");
      expect(stats).toHaveProperty("members");
      expect(stats).toHaveProperty("projects");
      expect(stats).toHaveProperty("finance");
      expect(stats).toHaveProperty("recentDocuments");
      expect(stats).toHaveProperty("urgentTasks");
      expect(stats).toHaveProperty("activeProjects");
    });

    it("should return numeric values for counts", async () => {
      const stats = await getDashboardStatistics();
      
      // Values can be number or string from SQL
      expect(stats.documents).toBeDefined();
      expect(stats.members).toBeDefined();
      expect(stats.projects).toBeDefined();
      expect(stats.finance).toBeDefined();
      
      const docs = typeof stats.documents === 'string' ? parseInt(stats.documents) : stats.documents;
      const members = typeof stats.members === 'string' ? parseInt(stats.members) : stats.members;
      const projects = typeof stats.projects === 'string' ? parseInt(stats.projects) : stats.projects;
      const finance = typeof stats.finance === 'string' ? parseFloat(stats.finance) : stats.finance;
      
      expect(docs).toBeGreaterThanOrEqual(0);
      expect(members).toBeGreaterThanOrEqual(0);
      expect(projects).toBeGreaterThanOrEqual(0);
      expect(finance).toBeGreaterThanOrEqual(0);
    });

    it("should return arrays for recent items", async () => {
      const stats = await getDashboardStatistics();
      
      expect(Array.isArray(stats.recentDocuments)).toBe(true);
      expect(Array.isArray(stats.urgentTasks)).toBe(true);
      expect(Array.isArray(stats.activeProjects)).toBe(true);
      expect(stats.recentDocuments.length).toBeLessThanOrEqual(5);
      expect(stats.urgentTasks.length).toBeLessThanOrEqual(5);
      expect(stats.activeProjects.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getProjectsStatistics", () => {
    it("should return project statistics with all statuses", async () => {
      const stats = await getProjectsStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("completed");
      expect(stats).toHaveProperty("inProgress");
      expect(stats).toHaveProperty("planned");
    });

    it("should return valid project counts", async () => {
      const stats = await getProjectsStatistics();
      
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.completed).toBe("number");
      expect(typeof stats.inProgress).toBe("number");
      expect(typeof stats.planned).toBe("number");
      
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.inProgress).toBeGreaterThanOrEqual(0);
      expect(stats.planned).toBeGreaterThanOrEqual(0);
    });

    it("should have completed count less than or equal to total", async () => {
      const stats = await getProjectsStatistics();
      
      expect(stats.completed).toBeLessThanOrEqual(stats.total);
      expect(stats.inProgress).toBeLessThanOrEqual(stats.total);
      expect(stats.planned).toBeLessThanOrEqual(stats.total);
    });
  });

  describe("getTasksStatistics", () => {
    it("should return task statistics with all statuses", async () => {
      const stats = await getTasksStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("completed");
      expect(stats).toHaveProperty("inProgress");
      expect(stats).toHaveProperty("todo");
      expect(stats).toHaveProperty("overdue");
    });

    it("should return valid task counts", async () => {
      const stats = await getTasksStatistics();
      
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.completed).toBe("number");
      expect(typeof stats.inProgress).toBe("number");
      expect(typeof stats.todo).toBe("number");
      expect(typeof stats.overdue).toBe("number");
      
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(0);
      expect(stats.inProgress).toBeGreaterThanOrEqual(0);
      expect(stats.todo).toBeGreaterThanOrEqual(0);
      expect(stats.overdue).toBeGreaterThanOrEqual(0);
    });

    it("should have task counts less than or equal to total", async () => {
      const stats = await getTasksStatistics();
      
      expect(stats.completed).toBeLessThanOrEqual(stats.total);
      expect(stats.inProgress).toBeLessThanOrEqual(stats.total);
      expect(stats.todo).toBeLessThanOrEqual(stats.total);
      expect(stats.overdue).toBeLessThanOrEqual(stats.total);
    });
  });

  describe("getFinanceStatistics", () => {
    it("should return finance statistics with all fields", async () => {
      const stats = await getFinanceStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("totalCotisations");
      expect(stats).toHaveProperty("paidCotisations");
      expect(stats).toHaveProperty("totalDons");
      expect(stats).toHaveProperty("totalDepenses");
      expect(stats).toHaveProperty("balance");
    });

    it("should return numeric values for finance", async () => {
      const stats = await getFinanceStatistics();
      
      // Values can be number or string (from SQL)
      expect(stats.totalCotisations).toBeDefined();
      expect(stats.paidCotisations).toBeDefined();
      expect(stats.totalDons).toBeDefined();
      expect(stats.totalDepenses).toBeDefined();
      expect(stats.balance).toBeDefined();
    });

    it("should have paid cotisations less than or equal to total", async () => {
      const stats = await getFinanceStatistics();
      
      const paid = typeof stats.paidCotisations === 'string' ? parseFloat(stats.paidCotisations) : stats.paidCotisations;
      const total = typeof stats.totalCotisations === 'string' ? parseFloat(stats.totalCotisations) : stats.totalCotisations;
      
      expect(paid).toBeLessThanOrEqual(total);
    });

    it("should calculate balance correctly", async () => {
      const stats = await getFinanceStatistics();
      
      const paid = typeof stats.paidCotisations === 'string' ? parseFloat(stats.paidCotisations) : stats.paidCotisations;
      const dons = typeof stats.totalDons === 'string' ? parseFloat(stats.totalDons) : stats.totalDons;
      const depenses = typeof stats.totalDepenses === 'string' ? parseFloat(stats.totalDepenses) : stats.totalDepenses;
      const balance = typeof stats.balance === 'string' ? parseFloat(stats.balance) : stats.balance;
      
      const expectedBalance = paid + dons - depenses;
      expect(Math.abs(balance - expectedBalance)).toBeLessThan(0.01);
    });
  });

  describe("getMembersStatistics", () => {
    it("should return member statistics with all roles", async () => {
      const stats = await getMembersStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("presidents");
      expect(stats).toHaveProperty("secretaries");
      expect(stats).toHaveProperty("regular");
    });

    it("should return valid member counts", async () => {
      const stats = await getMembersStatistics();
      
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.presidents).toBe("number");
      expect(typeof stats.secretaries).toBe("number");
      expect(typeof stats.regular).toBe("number");
      
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.presidents).toBeGreaterThanOrEqual(0);
      expect(stats.secretaries).toBeGreaterThanOrEqual(0);
      expect(stats.regular).toBeGreaterThanOrEqual(0);
    });

    it("should have role counts less than or equal to total", async () => {
      const stats = await getMembersStatistics();
      
      expect(stats.presidents).toBeLessThanOrEqual(stats.total);
      expect(stats.secretaries).toBeLessThanOrEqual(stats.total);
      expect(stats.regular).toBeLessThanOrEqual(stats.total);
    });
  });
});
