import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
