import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "advanced-member-test-admin",
    email: "advanced-member@example.com",
    name: "Advanced Member Admin",
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

describe("Advanced Member Management", () => {
  it("allows updating advanced profile (membership category, skills, availability)", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const membersList = await caller.members.list();
    if (membersList.length === 0) return;

    const memberId = membersList[0].id;
    const updated = await caller.members.updateAdvancedProfile({
      id: memberId,
      membershipCategory: "bienfaiteur",
      skills: "Comptabilité, Juridique",
      availability: "Week-end",
    });

    expect(updated).toBeDefined();
    expect(updated?.membershipCategory).toBe("bienfaiteur");
    expect(updated?.skills).toBe("Comptabilité, Juridique");
    expect(updated?.availability).toBe("Week-end");
  });

  it("issues certificates and lists them for a member", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const membersList = await caller.members.list();
    if (membersList.length === 0) return;

    const memberId = membersList[0].id;
    const cert = await caller.members.issueCertificate({
      memberId,
      certificateType: "membership_card",
    });

    expect(cert).toBeDefined();
    expect(cert.referenceNumber).toBeDefined();

    const certs = await caller.members.listCertificates({ memberId });
    expect(Array.isArray(certs)).toBe(true);
    expect(certs.length).toBeGreaterThan(0);
  });
});
