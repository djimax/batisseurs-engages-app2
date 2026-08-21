import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "email-filter-test-admin",
    email: "email-filter-test@example.com",
    name: "Email Filter Test",
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

describe("Email recipient targeting", () => {
  it("returns a safe recipient preview matching the requested status filter", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const recipients = await caller.email.getFilteredRecipients({ statuses: ["active"], excludeNoEmail: true });

    expect(recipients.every((recipient) => recipient.status === "active")).toBe(true);
    expect(recipients.every((recipient) => Boolean(recipient.email))).toBe(true);
    expect(recipients.every((recipient) => Object.keys(recipient).sort().join(",") === "email,firstName,id,lastName,role,status")).toBe(true);
  });

  it("supports role filters and explicit exclusions without returning excluded ids", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const initial = await caller.email.getFilteredRecipients({});
    const excludedMemberIds = initial.slice(0, 2).map((recipient) => recipient.id);
    const recipients = await caller.email.getFilteredRecipients({ roles: ["Membre"], excludedMemberIds });

    expect(recipients.some((recipient) => excludedMemberIds.includes(recipient.id))).toBe(false);
    expect(recipients.every((recipient) => recipient.role === "Membre")).toBe(true);
  });
});
