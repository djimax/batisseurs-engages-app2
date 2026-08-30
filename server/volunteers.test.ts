import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "volunteers-test-admin",
    email: "volunteers@example.com",
    name: "Volunteers Test Admin",
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

describe("Volunteer coordination", () => {
  it("uses dedicated member permissions for reads and edits", () => {
    const source = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain('assertPermission(ctx.user, "members.view")');
    expect(source).toContain('assertPermission(ctx.user, "members.edit")');
  });

  it("lists volunteers and supports skill and availability filters", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const all = await caller.volunteers.list({});

    expect(Array.isArray(all)).toBe(true);
    expect(all.every((member) => Array.isArray(member.assignments?.projects))).toBe(true);
    expect(all.every((member) => Array.isArray(member.assignments?.groups))).toBe(true);

    const filteredBySkill = await caller.volunteers.list({ skill: "communication" });
    expect(filteredBySkill.every((member) => (member.skills ?? "").toLowerCase().includes("communication"))).toBe(true);

    const filteredByAvailability = await caller.volunteers.list({ availability: "weekend" });
    expect(filteredByAvailability.every((member) => member.availability === "weekend")).toBe(true);
  });

  it("rejects an empty or unknown search without breaking the list contract", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.volunteers.list({ search: "terme-inexistant-pour-le-test" });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});
