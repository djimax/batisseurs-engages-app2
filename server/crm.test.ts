import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
const crmRouterSource = readFileSync(new URL("./crm-router.ts", import.meta.url), "utf8");
const mainRouterSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
import {
  createCrmContact,
  getCrmContact,
  listCrmContacts,
  updateCrmContact,
  deleteCrmContact,
  createCrmActivity,
  listCrmActivities,
  updateCrmActivity,
  createAdhesionPipeline,
  updateAdhesionPipeline,
  listAdhesionPipeline,
  createCrmReport,
  listCrmReports,
  createCrmEmailIntegration,
  listCrmEmailIntegration,
} from "./db";

describe("Critical resource authorization contract", () => {
  it("protects engagement metrics with the read permission", () => {
    expect(crmRouterSource).toContain("getEngagementMetrics");
    expect(crmRouterSource).toContain('assertPermission(ctx.user, "crm.view");\n        // Placeholder for engagement metrics calculation');
  });

  it("protects every CRM write family behind the authenticated admin guard", () => {
    expect(crmRouterSource.match(/assertPermission\(ctx\.user, "crm\.manage"\)/g)?.length).toBeGreaterThanOrEqual(8);
    expect(crmRouterSource).toContain("contacts:");
    expect(crmRouterSource).toContain("activities:");
    expect(crmRouterSource).toContain("pipeline:");
    expect(crmRouterSource).toContain("reports:");
    expect(crmRouterSource).toContain("email:");
  });

  it("keeps finance reads and writes behind distinct permissions", () => {
    expect(mainRouterSource).toContain('assertPermission(ctx.user, "finances.view")');
    expect(mainRouterSource).toContain('assertPermission(ctx.user, "finances.manage")');
  });
});

describe("CRM System", () => {
  it("centralizes audit coverage for every CRM write family", () => {
    const source = readFileSync(new URL("./crm-router.ts", import.meta.url), "utf8");
    expect(source).toContain('entityType: "crm_contact"');
    expect(source).toContain('entityType: "crm_activity"');
    expect(source).toContain('entityType: "crm_adhesion_pipeline"');
    expect(source).toContain('entityType: "crm_report"');
    expect(source).toContain('entityType: "crm_email"');
  });

  let contactId: number = 1;
  let activityId: number = 1;
  let pipelineId: number = 1;
  let reportId: number = 1;
  let emailId: number = 1;

  // ============ CONTACTS TESTS ============
  describe("Contacts Management", () => {
    it("should create a new contact", async () => {
      const contact = await createCrmContact({
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@example.com",
        phone: "+33612345678",
        company: "Tech Corp",
        position: "Développeur",
        city: "Paris",
        postalCode: "75001",
        country: "France",
        segment: "premium",
        status: "active",
        notes: "Contact important",
        createdBy: 1,
      } as any);

      expect(contact).toBeDefined();
      expect(contact.firstName).toBe("Jean");
      expect(contact.email).toBe("jean.dupont@example.com");
      contactId = contact.id;
    });

    it("should retrieve a contact by ID", async () => {
      const contact = await getCrmContact(contactId);
      expect(contact).toBeDefined();
      expect(contact?.firstName).toBe("Jean");
    });

    it("should list all contacts", async () => {
      const contacts = await listCrmContacts();
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts.length).toBeGreaterThan(0);
    });

    it("should update a contact", async () => {
      const updatedContact = await updateCrmContact(contactId, {
        status: "inactive",
        engagementScore: 85,
      } as any);

      expect(updatedContact).toBeDefined();
      expect(updatedContact.status).toBe("inactive");
      expect(updatedContact.engagementScore).toBe(85);
    });

    it("should delete a contact", async () => {
      const tempContact = await createCrmContact({
        firstName: "Temp",
        lastName: "User",
        email: "temp@example.com",
        createdBy: 1,
      } as any);

      await deleteCrmContact(tempContact.id);
      const deleted = await getCrmContact(tempContact.id);
      expect(deleted).toBeUndefined();
    });
  });

  // ============ ACTIVITIES TESTS ============
  describe("Activities Tracking", () => {
    it("should create a new activity", async () => {
      const activity = await createCrmActivity({
        contactId,
        type: "call",
        title: "Appel de suivi",
        description: "Discussion sur les besoins",
        status: "pending",
        priority: "high",
        createdBy: 1,
      } as any);

      expect(activity).toBeDefined();
      expect(activity.type).toBe("call");
      expect(activity.title).toBe("Appel de suivi");
      activityId = activity.id;
    });

    it("should list activities for a contact", async () => {
      const activities = await listCrmActivities(contactId);
      expect(Array.isArray(activities)).toBe(true);
    });

    it("should update an activity status", async () => {
      const updatedActivity = await updateCrmActivity(activityId, {
        status: "completed",
      } as any);

      expect(updatedActivity).toBeDefined();
      expect(updatedActivity.status).toBe("completed");
    });
  });

  // ============ ADHESION PIPELINE TESTS ============
  describe("Adhesion Pipeline", () => {
    it("should create a pipeline entry", async () => {
      const pipeline = await createAdhesionPipeline({
        contactId,
        stage: "application",
        notes: "Candidature reçue",
      } as any);

      expect(pipeline).toBeDefined();
      expect(pipeline.stage).toBe("application");
      pipelineId = pipeline.id;
    });

    it("should update pipeline status", async () => {
      const updatedPipeline = await updateAdhesionPipeline(pipelineId, {
        stage: "review",
      } as any);

      expect(updatedPipeline).toBeDefined();
      expect(updatedPipeline.stage).toBe("review");
    });

    it("should list all pipeline entries", async () => {
      const pipelines = await listAdhesionPipeline();
      expect(Array.isArray(pipelines)).toBe(true);
    });

    it("should approve an adhesion", async () => {
      const approvedPipeline = await updateAdhesionPipeline(pipelineId, {
        stage: "member",
        approvalDate: new Date(),
      } as any);

      expect(approvedPipeline.stage).toBe("member");
    });

    it("should reject an adhesion", async () => {
      const tempPipeline = await createAdhesionPipeline({
        contactId,
        stage: "review",
      } as any);

      const rejectedPipeline = await updateAdhesionPipeline(tempPipeline.id, {
        stage: "rejected",
        rejectionReason: "Critères non satisfaits",
      } as any);

      expect(rejectedPipeline.stage).toBe("rejected");
      expect(rejectedPipeline.rejectionReason).toBe("Critères non satisfaits");
    });
  });

  // ============ REPORTS TESTS ============
  describe("CRM Reports", () => {
    it("should create a report", async () => {
      const report = await createCrmReport({
        name: "Rapport d'engagement",
        type: "engagement",
        description: "Analyse de l'engagement des contacts",
        data: { totalContacts: 10, activeContacts: 8 },
        generatedBy: 1,
      } as any);

      expect(report).toBeDefined();
      expect(report.name).toBe("Rapport d'engagement");
      reportId = report.id;
    });

    it("should list all reports", async () => {
      const reports = await listCrmReports();
      expect(Array.isArray(reports)).toBe(true);
    });

    it("should create a pipeline report", async () => {
      const pipelineReport = await createCrmReport({
        name: "Rapport Pipeline",
        type: "pipeline",
        description: "État du pipeline d'adhésion",
        generatedBy: 1,
      } as any);

      expect(pipelineReport.type).toBe("pipeline");
    });
  });

  // ============ EMAIL INTEGRATION TESTS ============
  describe("Email Integration", () => {
    it("should log an email", async () => {
      const email = await createCrmEmailIntegration({
        contactId: contactId || 1,
        subject: "Suivi de candidature",
        content: "Nous avons bien reçu votre candidature",
        direction: "sent",
        status: "sent",
        sentBy: 1,
      } as any);

      expect(email).toBeDefined();
      expect(email.subject).toBe("Suivi de candidature");
      emailId = email.id;
    });

    it("should list email history for a contact", async () => {
      const emails = await listCrmEmailIntegration(contactId);
      expect(Array.isArray(emails)).toBe(true);
    });

    it("should track email status updates", async () => {
      const receivedEmail = await createCrmEmailIntegration({
        contactId: contactId || 1,
        subject: "Réponse à votre candidature",
        direction: "received",
        status: "opened",
      } as any);

      expect(receivedEmail.direction).toBe("received");
      expect(receivedEmail.status).toBe("opened");
    });
  });

  // ============ INTEGRATION TESTS ============
  describe("CRM Integration Scenarios", () => {
    it("should handle complete contact lifecycle", async () => {
      // Create contact
      const contact = await createCrmContact({
        firstName: "Marie",
        lastName: "Martin",
        email: "marie.martin@example.com",
        status: "prospect",
        createdBy: 1,
      } as any);

      // Create activity
      const activity = await createCrmActivity({
        contactId: contact.id,
        type: "meeting",
        title: "Réunion initiale",
        status: "completed",
        createdBy: 1,
      } as any);

      // Create pipeline entry
      const pipeline = await createAdhesionPipeline({
        contactId: contact.id,
        stage: "inquiry",
      } as any);

      // Log email
      const email = await createCrmEmailIntegration({
        contactId: contact.id,
        subject: "Bienvenue",
        direction: "sent",
        sentBy: 1,
      } as any);

      expect(contact).toBeDefined();
      expect(activity).toBeDefined();
      expect(pipeline).toBeDefined();
      expect(email).toBeDefined();
    });

    it("should track engagement metrics", async () => {
      const contact = await updateCrmContact(contactId, {
        engagementScore: 95,
        lastInteraction: new Date(),
      } as any);

      expect(contact.engagementScore).toBe(95);
      expect(contact.lastInteraction).toBeDefined();
    });
  });
});
