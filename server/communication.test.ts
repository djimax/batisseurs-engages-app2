import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "communication-test-admin",
    email: "communication-test@example.com",
    name: "Communication Test",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

describe("Communication persistence", () => {
  it("creates, filters, updates and deletes an announcement", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const title = `Annonce de test ${Date.now()}`;
    const created = await caller.announcements.create({
      title,
      content: "Annonce créée par le test d’intégration.",
      category: "tests",
      priority: "high",
      status: "draft",
    });
    expect(created.id).toBeGreaterThan(0);

    const drafts = await caller.announcements.getAll({ status: "draft", category: "tests" });
    expect(drafts.some((item) => item.id === created.id)).toBe(true);

    await caller.announcements.update({ id: created.id, status: "published" });
    const published = await caller.announcements.getAll({ status: "published" });
    expect(published.some((item) => item.id === created.id)).toBe(true);

    await expect(caller.announcements.delete({ id: created.id })).resolves.toEqual({ success: true });
  });

  it("supports news comments and removes comments with the news article", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const title = `Actualité de test ${Date.now()}`;
    const created = await caller.news.create({ title, content: "Article créé par le test d’intégration.", category: "tests", status: "published" });
    expect(created.id).toBeGreaterThan(0);

    const comment = await caller.news.addComment({ newsId: created.id, content: "Commentaire de validation." });
    const comments = await caller.news.getComments({ newsId: created.id });
    expect(comments.some((item) => item.id === comment.id)).toBe(true);

    await expect(caller.news.deleteComment({ id: comment.id })).resolves.toEqual({ success: true });
    expect((await caller.news.getComments({ newsId: created.id })).some((item) => item.id === comment.id)).toBe(false);
    await expect(caller.news.delete({ id: created.id })).resolves.toEqual({ success: true });
  });
});
