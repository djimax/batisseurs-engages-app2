import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Custom notification contract", () => {
  it("keeps custom creation protected and realtime-enabled", () => {
    const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    const center = readFileSync(new URL("./notification-center.ts", import.meta.url), "utf8");
    expect(router).toContain("createForUser: protectedProcedure");
    expect(router).toContain('assertPermission(ctx.user, "admin.users.manage")');
    expect(router).toContain("return createUserNotification(input)");
    expect(center).toContain("publishNotification");
  });

  it("renders an administrator-only accessible composer", () => {
    const page = readFileSync(new URL("../client/src/pages/Notifications.tsx", import.meta.url), "utf8");
    expect(page).toContain('user?.role === "admin"');
    expect(page).toContain("Notification personnalisée");
    expect(page).toContain('id="notification-user-id"');
    expect(page).toContain('id="notification-title"');
    expect(page).toContain('id="notification-message"');
    expect(page).toContain('aria-busy={createCustomNotification.isPending}');
  });
});
