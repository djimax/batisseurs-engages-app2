import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "membership-fee-admin",
    email: "membership-fee-admin@example.com",
    name: "Membership Fee Admin",
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

describe("Membership fee rules", () => {
  it("lists fee rules through the protected finance router", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const rules = await caller.finances.feeRules();

    expect(Array.isArray(rules)).toBe(true);
  });

  it("rejects a non-positive fee before persistence", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    await expect(caller.finances.createFeeRule({
      category: "standard",
      currency: "EUR",
      amount: "0",
      validFrom: "2026-08-21",
    })).rejects.toThrow("nombre positif");
  });

  it("returns a category-aware recommendation for a known member", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const members = await caller.members.list();
    if (members.length === 0) return;

    const recommendation = await caller.finances.suggestedFee({
      memberId: members[0].id,
      currency: "EUR",
    });

    expect(recommendation.category).toBeTruthy();
    expect(recommendation.currency).toBe("EUR");
    expect(recommendation.amount === null || typeof recommendation.amount === "number").toBe(true);
  });
});
