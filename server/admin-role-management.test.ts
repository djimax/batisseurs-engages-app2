import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-role-test",
    email: "admin-role-test@example.com",
    name: "Admin Role Test",
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

describe("Admin role management", () => {
  it("creates, updates and deletes a custom role", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const roleName = `Rôle test ${Date.now()}`;

    await caller.admin.createRole({ name: roleName, description: "Rôle temporaire de validation" });
    let role = (await caller.admin.getRoles()).find((candidate) => candidate.name === roleName);
    expect(role).toBeDefined();

    await caller.admin.updateRole({ roleId: role!.id, name: `${roleName} modifié`, description: "Description mise à jour" });
    role = (await caller.admin.getRoles()).find((candidate) => candidate.id === role!.id);
    expect(role?.name).toBe(`${roleName} modifié`);
    expect(role?.description).toBe("Description mise à jour");

    await expect(caller.admin.deleteRole({ roleId: role!.id })).resolves.toEqual({ success: true });
    expect((await caller.admin.getRoles()).some((candidate) => candidate.id === role!.id)).toBe(false);
  });

  it("exposes the audit-view permission and supports action filtering", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const permissions = await caller.admin.getPermissions();
    expect(permissions.some((permission) => permission.name === "admin.audit.view")).toBe(true);

    const logs = await caller.admin.getAuditLogs({ limit: 50, offset: 0, action: "CREATE" });
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.every((log) => log.action === "CREATE")).toBe(true);
  });
});
