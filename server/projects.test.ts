import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  deleteProject,
  addProjectMember,
  getProjectMembers,
  removeProjectMember,
  createProjectTask,
  getProjectTasks,
  updateProjectTask,
  deleteProjectTask,
  createProjectMilestone,
  getProjectMilestones,
  updateProjectMilestone,
  deleteProjectMilestone,
  createProjectUpdate,
  getProjectUpdates,
  createProjectTaskComment,
  getProjectTaskComments,
  deleteProjectTaskComment,
  getProjectReport,
  getProjectBudgetItems,
  createProjectBudgetItem,
  updateProjectBudgetItem,
  deleteProjectBudgetItem,
} from "./db";

describe("Projects permission integrity", () => {
  it("protects project subresources with view/manage permissions", () => {
    const source = readFileSync(new URL("../server/routers.ts", import.meta.url), "utf8");
    const projectBlock = source.slice(source.indexOf("projects: router({"), source.indexOf("projects: router({") + 19000);
    expect(projectBlock).toContain('assertPermission(ctx.user, "projects.view")');
    expect(projectBlock).toContain('assertPermission(ctx.user, "projects.manage")');
    expect(projectBlock).toContain("getTasks: protectedProcedure");
    expect(projectBlock).toContain("createTask: protectedProcedure");
    expect(projectBlock).toContain("getMilestones: protectedProcedure");
    expect(projectBlock).toContain("createMilestone: protectedProcedure");
    expect(projectBlock).toContain("await logAudit");
    expect(projectBlock).toContain('action: "CREATE"');
    expect(projectBlock).toContain('action: "UPDATE"');
    expect(projectBlock).toContain('action: "DELETE"');
    expect(projectBlock).toContain('eventKey: "project.assigned"');
    expect(projectBlock).toContain('dedupeKey: `project:${project.id}:assigned:${leader.userId}`');
    expect(projectBlock).toContain('eventKey: "project.task.assigned"');
    expect(projectBlock).toContain('entityType: "project_task"');
    expect(projectBlock).toContain('dedupeKey: `project-task:${task.id}:assigned:${assignee.userId}`');
  });
});

describe("Projects UI integrity", () => {
  it("validates project budgets before mutation", () => {
    const source = readFileSync(new URL("../client/src/pages/Projects.tsx", import.meta.url), "utf8");
    expect(source).toContain("Number.isFinite(Number(formData.budget))");
    expect(source).toContain("Number(formData.budget) <= 0");
    expect(source).toContain("Le budget doit être un montant positif");
  });

  it("supports an explicit project budget currency", () => {
    const source = readFileSync(new URL("../client/src/pages/Projects.tsx", import.meta.url), "utf8");
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(source).toContain("Devise du budget");
    expect(source).toContain('value="XOF">Franc CFA (F)');
    expect(source).toContain('value="EUR">Euro (€)');
    expect(source).toContain("currency: formData.currency");
    expect(source).toContain('project.currency === "EUR" ? "€" : "F CFA"');
    expect(source).toContain('{ header: "Devise"');
    expect(source).toContain('project.leaderName || (project.leaderId ? `Membre #${project.leaderId}` : "")');
    expect(source).toContain("Chef de projet * (membre actif obligatoire)");
    expect(source).not.toContain('>Aucun responsable</SelectItem>');
    expect(source).toContain('<Select value={formData.leaderId}');
    expect(source).not.toContain('formData.leaderId || "none"');
    expect(source).toContain("Responsable:");
    expect(source).toContain('"Non renseigné"');
    expect(router).toContain('currency: z.enum(["EUR", "XOF"]).default("XOF")');
    expect(schema).toContain("currency: mysqlEnum(['EUR', 'XOF']).default('XOF')");
  });

  it("renders human-readable project status labels", () => {
    const source = readFileSync(new URL("../client/src/pages/Projects.tsx", import.meta.url), "utf8");
    expect(source).toContain('label: "Planification"');
    expect(source).toContain('label: "En cours"');
    expect(source).toContain('label: "Terminé"');
    expect(source).not.toContain("<Badge className={colors[status] || \"\"}>{status}</Badge>");
  });

  it("selects an active member instead of accepting a raw leader id", () => {
    const source = readFileSync(new URL("../client/src/pages/Projects.tsx", import.meta.url), "utf8");
    expect(source).toContain("trpc.members.list.useQuery");
    expect(source).toContain('members.filter((member) => member.status === "active")');
    expect(source).toContain("Sélectionner un membre actif");
    expect(source).not.toContain('placeholder="ID du chef de projet"');
  });
});

describe("Projects Management", () => {
  let projectId: number;
  let taskId: number;
  let milestoneId: number;
  let budgetItemId: number;

  describe("Project CRUD", () => {
    it("should create a project", async () => {
      const project = await createProject({
        name: "Test Project",
        description: "A test project",
        status: "planning",
        budget: "1000",
        leaderId: 1,
        createdBy: 1,
      });

      expect(project).toBeDefined();
      expect(project.name).toBe("Test Project");
      expect(project.status).toBe("planning");
      projectId = project.id;
    });

    it("should get a project by id", async () => {
      const project = await getProject(projectId);

      expect(project).toBeDefined();
      expect(project.id).toBe(projectId);
      expect(project.name).toBe("Test Project");
    });

    it("should list projects", async () => {
      const projects = await listProjects(10, 0);

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
    });

    it("should list projects with status filter", async () => {
      const projects = await listProjects(10, 0, "planning");

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.every((p: any) => p.status === "planning")).toBe(true);
    });

    it("should update a project", async () => {
      const updated = await updateProject(projectId, {
        status: "in-progress",
        budget: "2000",
      });

      expect(updated).toBeDefined();
      expect(updated.status).toBe("in-progress");
      expect(updated.budget).toBe("2000");
    });

    it("should delete a project", async () => {
      const result = await deleteProject(projectId);

      expect(result.success).toBe(true);

      const deleted = await getProject(projectId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Project Tasks", () => {
    beforeAll(async () => {
      const project = await createProject({
        name: "Task Test Project",
        description: "Project for testing tasks",
        status: "planning",
        leaderId: 1,
        createdBy: 1,
      });
      projectId = project.id;
    });

    it("should create a task", async () => {
      const task = await createProjectTask({
        projectId,
        title: "Test Task",
        description: "A test task",
        status: "todo",
        priority: "high",
      });

      expect(task).toBeDefined();
      expect(task.title).toBe("Test Task");
      expect(task.priority).toBe("high");
      taskId = task.id;
    });

    it("should get project tasks", async () => {
      const tasks = await getProjectTasks(projectId);

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
    });

    it("should update a task", async () => {
      const updated = await updateProjectTask(taskId, {
        status: "in-progress",
      });

      expect(updated).toBeDefined();
      expect(updated.status).toBe("in-progress");
    });

    it("should delete a task", async () => {
      const result = await deleteProjectTask(taskId);

      expect(result.success).toBe(true);
    });

    afterAll(async () => {
      await deleteProject(projectId);
    });
  });

  describe("Project Milestones", () => {
    beforeAll(async () => {
      const project = await createProject({
        name: "Milestone Test Project",
        description: "Project for testing milestones",
        status: "planning",
        leaderId: 1,
        createdBy: 1,
      });
      projectId = project.id;
    });

    it("should create a milestone", async () => {
      const milestone = await createProjectMilestone({
        projectId,
        title: "Test Milestone",
        description: "A test milestone",
        dueDate: new Date("2026-12-31"),
        status: "pending",
      });

      expect(milestone).toBeDefined();
      expect(milestone.title).toBe("Test Milestone");
      expect(milestone.status).toBe("pending");
      milestoneId = milestone.id;
    });

    it("should get project milestones", async () => {
      const milestones = await getProjectMilestones(projectId);

      expect(Array.isArray(milestones)).toBe(true);
      expect(milestones.length).toBeGreaterThan(0);
    });

    it("should update a milestone", async () => {
      const updated = await updateProjectMilestone(milestoneId, {
        status: "completed",
      });

      expect(updated).toBeDefined();
      expect(updated.status).toBe("completed");
    });

    it("should delete a milestone", async () => {
      const result = await deleteProjectMilestone(milestoneId);

      expect(result.success).toBe(true);
    });

    afterAll(async () => {
      await deleteProject(projectId);
    });
  });

  describe("Project Budget", () => {
    beforeAll(async () => {
      const project = await createProject({
        name: "Budget Test Project",
        description: "Project for testing budget",
        status: "planning",
        leaderId: 1,
        createdBy: 1,
      });
      projectId = project.id;
    });

    it("should create a budget item", async () => {
      const item = await createProjectBudgetItem({
        projectId,
        category: "Materials",
        amount: "500",
        description: "Test budget item",
      });

      expect(item).toBeDefined();
      expect(item.category).toBe("Materials");
      expect(item.amount).toBe("500");
      budgetItemId = item.id;
    });

    it("should get project budget items", async () => {
      const items = await getProjectBudgetItems(projectId);

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it("should update a budget item", async () => {
      const updated = await updateProjectBudgetItem(budgetItemId, {
        spent: "200",
      });

      expect(updated).toBeDefined();
      expect(updated.spent).toBe("200");
    });

    it("should delete a budget item", async () => {
      const result = await deleteProjectBudgetItem(budgetItemId);

      expect(result.success).toBe(true);
    });

    afterAll(async () => {
      await deleteProject(projectId);
    });
  });

  describe("Project Members", () => {
    beforeAll(async () => {
      const project = await createProject({
        name: "Members Test Project",
        description: "Project for testing members",
        status: "planning",
        leaderId: 1,
        createdBy: 1,
      });
      projectId = project.id;
    });

    it("should add a project member", async () => {
      const member = await addProjectMember({
        projectId,
        memberId: 2,
        role: "member",
      });

      expect(member).toBeDefined();
      expect(member.memberId).toBe(2);
      expect(member.role).toBe("member");
    });

    it("should get project members", async () => {
      const members = await getProjectMembers(projectId);

      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
    });

    it("should remove a project member", async () => {
      const members = await getProjectMembers(projectId);
      const memberId = members[0].id;

      const result = await removeProjectMember(memberId);

      expect(result.success).toBe(true);
    });

    afterAll(async () => {
      await deleteProject(projectId);
    });
  });

  describe("Project Updates", () => {
    beforeAll(async () => {
      const project = await createProject({
        name: "Updates Test Project",
        description: "Project for testing updates",
        status: "planning",
        leaderId: 1,
        createdBy: 1,
      });
      projectId = project.id;
    });

    it("should create a project update", async () => {
      const update = await createProjectUpdate({
        projectId,
        title: "Test Update",
        content: "This is a test update",
        createdBy: 1,
      });

      expect(update).toBeDefined();
      expect(update.title).toBe("Test Update");
      expect(update.content).toBe("This is a test update");
    });

    it("should get project updates", async () => {
      const updates = await getProjectUpdates(projectId);

      expect(Array.isArray(updates)).toBe(true);
      expect(updates.length).toBeGreaterThan(0);
    });

    afterAll(async () => {
      await deleteProject(projectId);
    });
  });

  describe("Project Reports and Task Comments", () => {
    let reportProjectId: number;
    let reportTaskId: number;
    let commentId: number;

    beforeAll(async () => {
      const project = await createProject({
        name: "Report Test Project",
        description: "Project for report and discussion tests",
        status: "in-progress",
        budget: "2500",
        leaderId: 1,
        createdBy: 1,
      });
      reportProjectId = project.id;

      const task = await createProjectTask({
        projectId: reportProjectId,
        title: "Report task",
        status: "completed",
        priority: "high",
      });
      reportTaskId = task.id;
    });

    it("should create, list and delete a task comment", async () => {
      const comment = await createProjectTaskComment({
        projectId: reportProjectId,
        taskId: reportTaskId,
        authorId: 1,
        content: "Décision validée pendant la réunion projet.",
      });

      expect(comment).toBeDefined();
      expect(comment.content).toContain("Décision validée");
      commentId = comment.id;

      const comments = await getProjectTaskComments(reportTaskId);
      expect(comments.some((item) => item.id === commentId)).toBe(true);

      const deletion = await deleteProjectTaskComment(commentId);
      expect(deletion.success).toBe(true);
    });

    it("should return a coherent project report", async () => {
      const report = await getProjectReport(reportProjectId);

      expect(report.project?.id).toBe(reportProjectId);
      expect(report.tasks.total).toBeGreaterThanOrEqual(1);
      expect(report.tasks.completed).toBeGreaterThanOrEqual(1);
      expect(report.progressPercentage).toBeGreaterThanOrEqual(0);
      expect(report.progressPercentage).toBeLessThanOrEqual(100);
      expect(report.budget.remaining).toBe(report.budget.planned - report.budget.spent);
      expect(typeof report.generatedAt).toBe("string");
    });

    afterAll(async () => {
      await deleteProject(reportProjectId);
    });
  });
});


describe("Project planning and task discussion hardening", () => {
  it("validates task-project ownership and audits discussion mutations", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const page = readFileSync(new URL("../client/src/pages/ProjectDetail.tsx", import.meta.url), "utf8");
    expect(router).toContain("assertProjectTaskBelongsToProject");
    expect(router).toContain('entityType: "project_task_comment"');
    expect(router).toContain("Commentaire introuvable dans ce projet.");
    expect(page).toContain("Afficher le détail accessible de la planification");
    expect(page).toContain("Détail tabulaire de la timeline du projet");
    expect(page).toContain("projectId, taskId: selectedTaskId ?? 0");
    expect(page).toContain("projectId });");
  });
});
