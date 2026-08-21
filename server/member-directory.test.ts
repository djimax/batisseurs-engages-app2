import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "member-directory-test-admin",
    email: "member-directory@example.com",
    name: "Member Directory Admin",
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

describe("Internal member directory", () => {
  it("returns active members only by default and includes contribution summaries", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const directory = await caller.members.directory({});

    expect(Array.isArray(directory)).toBe(true);
    expect(directory.every((member) => member.status === "active")).toBe(true);
    expect(directory.every((member) => Boolean(member.contributions))).toBe(true);
    expect(directory.every((member) => Array.isArray(member.contributions.recent))).toBe(true);
  });

  it("supports searching by member name or skill and keeps alphabetical sorting", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const directory = await caller.members.directory({ search: "", sortBy: "name_asc" });
    const names = directory.map((member) => `${member.lastName} ${member.firstName}`);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    if (directory[0]?.skills) {
      const skillToken = directory[0].skills.split(",")[0].trim();
      const filtered = await caller.members.directory({ search: skillToken });
      expect(filtered.some((member) => member.id === directory[0].id)).toBe(true);
    }
  });

  it("supports explicit all-status scope for administrative review", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const directory = await caller.members.directory({ status: "all", sortBy: "recent" });

    expect(directory.every((member) => member.contributions.cotisationsCount >= 0)).toBe(true);
    expect(directory.every((member) => member.contributions.historyCount >= 0)).toBe(true);
  });
});
