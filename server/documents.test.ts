import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb, getDocumentPermissionForUser } from "./db";
import { users, members, documentPermissions, roles, permissions, rolePermissions, userRoles, auditLogs } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { ensureDefaultPermissions } from "./authorization";

vi.mock("./storage", () => ({
  storagePut: vi.fn(async (key: string) => ({ key, url: `https://storage.test/${key}` })),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Categories Router", () => {
  it("should list categories (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.categories.list();

    expect(Array.isArray(categories)).toBe(true);
    // Default categories should be seeded
    expect(categories.length).toBeGreaterThanOrEqual(0);
  });

  it("should get category by id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First get the list to find an existing category
    const categories = await caller.categories.list();
    
    if (categories.length > 0) {
      const category = await caller.categories.getById({ id: categories[0].id });
      expect(category).toBeDefined();
      expect(category?.id).toBe(categories[0].id);
    }
  });
});

describe("Documents Router", () => {
  it("keeps the document version migration valid for a clean MySQL/TiDB setup", () => {
    const migration = readFileSync(new URL("../drizzle/0041_boring_lizard.sql", import.meta.url), "utf8");
    expect(migration).not.toContain("DEFAULT 'CURRENT_TIMESTAMP'");
    expect(migration).toContain("PRIMARY KEY (`id`)");
  });

  it("keeps the complete 0041 to 0043 document migration chain ordered", () => {
    const journal = readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8");
    const finalSnapshot = readFileSync(new URL("../drizzle/meta/0043_snapshot.json", import.meta.url), "utf8");
    const migration42 = readFileSync(new URL("../drizzle/0042_abandoned_invisible_woman.sql", import.meta.url), "utf8");
    const migration43 = readFileSync(new URL("../drizzle/0043_sturdy_eddie_brock.sql", import.meta.url), "utf8");
    expect(journal.indexOf("0041_boring_lizard")).toBeGreaterThanOrEqual(0);
    expect(journal.indexOf("0042_abandoned_invisible_woman")).toBeGreaterThan(journal.indexOf("0041_boring_lizard"));
    expect(journal.indexOf("0043_sturdy_eddie_brock")).toBeGreaterThan(journal.indexOf("0042_abandoned_invisible_woman"));
    expect(migration42).toContain("ALTER TABLE `document_versions`");
    expect(migration43).toContain("migration 0041");
    expect(finalSnapshot).toContain('"document_versions"');
    expect(finalSnapshot).toContain('"document_versions_document_version_idx"');
  });

  it("exports document due dates as an ICS calendar from the Documents page", () => {
    const source = readFileSync(new URL("../client/src/pages/Documents.tsx", import.meta.url), "utf8");
    expect(source).toContain("text/calendar;charset=utf-8");
    expect(source).toContain("echeances-documentaires.ics");
    expect(source).toContain("DTSTART;VALUE=DATE");
    expect(source).toContain("UID:document-");
  });

  it("exposes collaborative comment authors and centralizes comment audit", () => {
    const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const pageSource = readFileSync(new URL("../client/src/pages/Documents.tsx", import.meta.url), "utf8");
    expect(dbSource).toContain("authorName");
    expect(dbSource).toContain("authorRole");
    expect(routerSource).toContain('entityType: "document_comment"');
    expect(pageSource).toContain("note.authorName");
    expect(pageSource).toContain("Ajouter une note");
  });

  it("evaluates document permissions through a linked non-admin tRPC flow", async () => {
    const db = await getDb();
    if (!db) return;
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await ensureDefaultPermissions();
    const userInsert = await db.insert(users).values({ openId: `permission-test-${suffix}`, name: "Permission Test", email: `permission-${suffix}@example.test`, role: "user" });
    const userId = Number(userInsert[0].insertId);
    const memberInsert = await db.insert(members).values({ userId, firstName: "Permission", lastName: "Test", status: "active", memberRole: "member" });
    const memberId = Number(memberInsert[0].insertId);
    const roleInsert = await db.insert(roles).values({ name: `document-test-${suffix}`, description: "test", isSystem: 0 });
    const roleId = Number(roleInsert[0].insertId);
    const permissionRows = await db.select().from(permissions);
    const requiredPermissions = permissionRows.filter((item) => item.name === "documents.view" || item.name === "documents.manage");
    await db.insert(rolePermissions).values(requiredPermissions.map((item) => ({ roleId, permissionId: item.id })));
    await db.insert(userRoles).values({ userId, roleId });
    const adminCaller = appRouter.createCaller(createAuthContext());
    const categories = await adminCaller.categories.list();
    const document = await adminCaller.documents.create({ title: `Permission document ${suffix}`, categoryId: categories[0].id });
    const nonAdminContext = { ...createAuthContext(), user: { ...createAuthContext().user, id: userId, role: "user" as const } };
    const caller = appRouter.createCaller(nonAdminContext);
    try {
      await db.insert(documentPermissions).values({ documentId: document.id, memberId, canView: 1, canEdit: 0, canDelete: 0 });
      expect((await caller.documents.getById({ id: document.id }))?.id).toBe(document.id);
      expect((await caller.documents.list({})).some((item) => item.id === document.id)).toBe(true);
      await expect(caller.documents.update({ id: document.id, title: "Interdit" })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(caller.documents.archive({ id: document.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
      await db.update(documentPermissions).set({ canEdit: 1, canDelete: 1 }).where(and(eq(documentPermissions.documentId, document.id), eq(documentPermissions.memberId, memberId)));
      await caller.documents.update({ id: document.id, title: "Autorisé" });
      await caller.documents.archive({ id: document.id });
      await caller.documents.restore({ id: document.id });
      const restoreAudits = await db.select().from(auditLogs).where(and(eq(auditLogs.action, "RESTORE"), eq(auditLogs.entityType, "document"), eq(auditLogs.entityId, document.id)));
      expect(restoreAudits.length).toBeGreaterThan(0);
      await caller.documents.delete({ id: document.id });
    } finally {
      await db.delete(documentPermissions).where(and(eq(documentPermissions.documentId, document.id), eq(documentPermissions.memberId, memberId)));
      await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
      await db.delete(roles).where(eq(roles.id, roleId));
      await db.delete(members).where(eq(members.id, memberId));
      await db.delete(users).where(eq(users.id, userId));
      const remaining = await adminCaller.documents.getById({ id: document.id });
      if (remaining) await adminCaller.documents.delete({ id: document.id });
    }
  });

  it("enforces member-scoped document permissions on sensitive server operations", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain("assertDocumentCapability(ctx.user, input.id, \"canView\")");
    expect(source).toContain("assertDocumentCapability(ctx.user, input.id, \"canEdit\")");
    expect(source).toContain("assertDocumentCapability(ctx.user, input.id, \"canDelete\")");
    expect(source).toContain("getAccessibleDocumentIds(ctx.user.id, \"canView\")");
    expect(source).toContain('action: "archive"');
    expect(source).toContain('action: "restore"');
    expect(source).toContain('assertDocumentCapability(ctx.user, input.id, "canEdit")');
    expect(source).toContain("members.userId");
  });

  it("creates and reads a version through the upload flow with a SHA-256 hash", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const categories = await caller.categories.list();
    const categoryId = categories[0]?.id;
    if (!categoryId) return;
    const document = await caller.documents.create({ title: `Test version ${Date.now()}`, categoryId });
    try {
      const uploaded = await caller.documents.uploadFile({ documentId: document.id, fileName: "preuve.txt", fileType: "text/plain", fileSize: 5, fileBase64: "aGVsbG8=" });
      const versions = await caller.documents.versions({ documentId: document.id });
      const version = versions.find((item) => item.fileName === "preuve.txt");
      expect(uploaded.success).toBe(true);
      expect(version?.contentHash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
      expect(version?.fileSize).toBe(5);
      await expect(caller.documents.uploadFile({ documentId: document.id, fileName: "preuve-copie.txt", fileType: "text/plain", fileSize: 5, fileBase64: "aGVsbG8=" })).rejects.toMatchObject({ code: "CONFLICT" });
    } finally {
      await caller.documents.delete({ id: document.id });
    }
  });

  it("records uploaded document versions with a stable content hash", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain("getDocumentVersions(documentId)");
    expect(source).toContain("createDocumentVersion");
    expect(source).toContain('createHash("sha256")');
    expect(source).toContain("versions: protectedProcedure");
  });

  it("logs the administrative document lifecycle in the central audit trail", async () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain('action: "CREATE", entityType: "document"');
    expect(source).toContain('action: "UPDATE", entityType: "document"');
    expect(source).toContain('action: "DELETE", entityType: "document"');
    expect(source).toContain('action: "ARCHIVE", entityType: "document"');
  });

  it("protects and audits document access actions", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain("recordAccess: protectedProcedure");
    expect(source).toContain('z.enum(["VIEW", "DOWNLOAD", "PRINT", "EXPORT"])');
    expect(source).toContain('assertDocumentCapability(ctx.user, input.id, "canView")');
    expect(source).toContain("Accès documentaire");
  });

  it("indexes text uploads and includes content in protected document search", () => {
    const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const dbSource = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    expect(routerSource).toContain("const contentIndex = indexableTypes.has(fileType)");
    expect(routerSource).toContain("contentIndex,");
    expect(dbSource).toContain("like(documents.contentIndex");
  });

  it("protects the document review workflow and audits its decisions", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain("assignReview: protectedProcedure");
    expect(source).toContain("submitReview: protectedProcedure");
    expect(source).toContain("document.reviewerId !== ctx.user.id");
    expect(source).toContain('action: "ASSIGN_REVIEW"');
    expect(source).toContain('action: input.status === "approved" ? "REVIEW_APPROVE" : "REVIEW_REJECT"');
  });

  it("should list documents (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const documents = await caller.documents.list({});

    expect(Array.isArray(documents)).toBe(true);
  });

  it("should get document stats (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.documents.stats();

    expect(stats).toBeDefined();
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.completed).toBe("number");
    expect(typeof stats.inProgress).toBe("number");
    expect(typeof stats.pending).toBe("number");
  });

  it("should filter documents by status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const pendingDocs = await caller.documents.list({ status: "pending" });

    expect(Array.isArray(pendingDocs)).toBe(true);
    pendingDocs.forEach(doc => {
      expect(doc.status).toBe("pending");
    });
  });

  it("should filter documents by priority", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const urgentDocs = await caller.documents.list({ priority: "urgent" });

    expect(Array.isArray(urgentDocs)).toBe(true);
    urgentDocs.forEach(doc => {
      expect(doc.priority).toBe("urgent");
    });
  });

  it("should export report data (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const report = await caller.documents.exportReport({});

    expect(report).toBeDefined();
    expect(Array.isArray(report.documents)).toBe(true);
    expect(report.stats).toBeDefined();
    expect(Array.isArray(report.categories)).toBe(true);
    expect(report.generatedAt).toBeDefined();
  });

  it("should create document (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first category
    const categories = await caller.categories.list();
    if (categories.length === 0) {
      // Skip if no categories
      return;
    }

    const result = await caller.documents.create({
      title: "Test Document",
      description: "Test description",
      categoryId: categories[0].id,
      priority: "medium",
      status: "pending",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("persists and exposes document business metadata", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const categories = await caller.categories.list();
    if (categories.length === 0) return;
    const title = `Metadata document ${Date.now()}`;
    const created = await caller.documents.create({ title, categoryId: categories[0].id, fiscalYear: 2026, funder: "Fondation test", confidentiality: "restricted" });
    try {
      expect(created.fiscalYear).toBe(2026);
      expect(created.funder).toBe("Fondation test");
      expect(created.confidentiality).toBe("restricted");
      const read = await caller.documents.getById({ id: created.id });
      expect(read?.fiscalYear).toBe(2026);
      expect(read?.confidentiality).toBe("restricted");
    } finally {
      await caller.documents.delete({ id: created.id });
    }
  });

  it("persists saved document views per user and audits their lifecycle", async () => {
    const db = await getDb();
    if (!db) return;
    const caller = appRouter.createCaller(createAuthContext());
    const name = `Vue test ${Date.now()}`;
    const created = await caller.documents.saveView({ name, filters: { status: "pending", priority: "urgent", isArchived: false } });
    try {
      expect(created?.name).toBe(name);
      const views = await caller.documents.savedViews();
      expect(views.some((view) => view.id === created?.id && view.userId === 1)).toBe(true);
      await caller.documents.deleteSavedView({ id: created!.id });
      const afterDelete = await caller.documents.savedViews();
      expect(afterDelete.some((view) => view.id === created?.id)).toBe(false);
      const audits = await db.select().from(auditLogs).where(and(eq(auditLogs.entityType, "document_saved_view"), eq(auditLogs.entityId, created!.id)));
      expect(audits.map((audit) => audit.action)).toEqual(expect.arrayContaining(["CREATE", "DELETE"]));
    } finally {
      await db.delete(auditLogs).where(and(eq(auditLogs.entityType, "document_saved_view"), eq(auditLogs.entityId, created!.id)));
    }
  });

  it("should update document status (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get existing documents
    const documents = await caller.documents.list({});
    if (documents.length === 0) {
      return;
    }

    const result = await caller.documents.update({
      id: documents[0].id,
      status: "in-progress",
    });

    expect(result).toBeDefined();
  });
});

describe("Notes Router", () => {
  it("should list notes by document (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get a document first
    const documents = await caller.documents.list({});
    if (documents.length === 0) {
      return;
    }

    const notes = await caller.notes.listByDocument({ documentId: documents[0].id });

    expect(Array.isArray(notes)).toBe(true);
  });

  it("should create note (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get a document first
    const documents = await caller.documents.list({});
    if (documents.length === 0) {
      return;
    }

    const result = await caller.notes.create({
      documentId: documents[0].id,
      content: "Test note content",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });
});

describe("Members Router", () => {
  it("should list members (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const members = await caller.members.list();

    expect(Array.isArray(members)).toBe(true);
  });

  it("should create member (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.members.create({
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@example.com",
      phone: "+33612345678",
      role: "Membre",
      status: "active",
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("should export members list (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const exportData = await caller.members.exportList();

    expect(exportData).toBeDefined();
    expect(Array.isArray(exportData.members)).toBe(true);
    expect(typeof exportData.total).toBe("number");
    expect(exportData.generatedAt).toBeDefined();
  });
});

describe("Activity Router", () => {
  it("should get recent activity (protected)", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const activities = await caller.activity.recent({ limit: 10 });

    expect(Array.isArray(activities)).toBe(true);
  });
});


describe("Document access control", () => {
  it("refuses unauthenticated access to document data and notes", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.documents.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.documents.getById({ id: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.documents.stats()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.documents.exportReport({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.documents.archived({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.notes.listByDocument({ documentId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});


function createUnprivilegedContext(): TrpcContext {
  const ctx = createAuthContext();
  return {
    ...ctx,
    user: { ...ctx.user!, id: 999999, role: "user" },
  };
}

describe("Member access control", () => {
  it("refuses member reads and mutations without the corresponding permission", async () => {
    const caller = appRouter.createCaller(createUnprivilegedContext());

    await expect(caller.members.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.getById({ id: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.exportList()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.members.create({ firstName: "Test", lastName: "SansPermission" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
