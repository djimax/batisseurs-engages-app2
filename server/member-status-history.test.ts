import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "status-history-admin",
    email: "status-admin@example.com",
    name: "Status Admin",
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

describe("Member status history and administration", () => {
  it("allows retrieving status history for a member", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const membersList = await caller.members.list();
    if (membersList.length === 0) return;

    const sampleMember = membersList[0];
    const history = await caller.members.statusHistory({ memberId: sampleMember.id });

    expect(Array.isArray(history)).toBe(true);
  });
});
