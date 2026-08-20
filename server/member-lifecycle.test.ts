import { describe, expect, it } from "vitest";
import {
  MEMBER_STATUS_LABELS,
  buildMemberCardPayload,
  getMemberDisplayStatus,
  memberStatusSchema,
} from "./member-lifecycle";

describe("Cycle de vie des membres", () => {
  it("accepte les statuts métier complets", () => {
    expect(memberStatusSchema.parse("active")).toBe("active");
    expect(memberStatusSchema.parse("suspended")).toBe("suspended");
    expect(memberStatusSchema.parse("resigned")).toBe("resigned");
    expect(memberStatusSchema.parse("deceased")).toBe("deceased");
    expect(memberStatusSchema.parse("archived")).toBe("archived");
  });

  it("rejette un statut inconnu", () => {
    expect(() => memberStatusSchema.parse("unknown")).toThrow();
  });

  it("retourne le libellé métier du statut", () => {
    expect(getMemberDisplayStatus("suspended")).toBe("Suspendu");
    expect(getMemberDisplayStatus("invalid")).toBe("Inconnu");
    expect(MEMBER_STATUS_LABELS.active).toBe("Actif");
  });

  it("génère un payload QR stable et sans données sensibles", () => {
    const payload = buildMemberCardPayload({
      id: 12,
      memberId: "1-08-26-0012",
      firstName: "Amina",
      lastName: "Diallo",
      status: "active",
      joinedAt: "2026-08-20 10:00:00",
    });
    expect(JSON.parse(payload)).toEqual({
      type: "les-batisseurs-engages-member-card",
      memberId: 12,
      memberCode: "1-08-26-0012",
      status: "active",
      issuedAt: "2026-08-20 10:00:00",
    });
    expect(payload).not.toContain("Amina");
    expect(payload).not.toContain("Diallo");
  });
});
