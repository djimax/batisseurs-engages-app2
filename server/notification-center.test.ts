import { describe, expect, it } from "vitest";
import { getMembershipReminderKind, normalizeNotificationPreferences } from "./notification-center";

describe("Centre de notifications", () => {
  it("normalise les préférences invalides sans planter", () => {
    expect(normalizeNotificationPreferences(null)).toEqual({});
    expect(normalizeNotificationPreferences([])).toEqual({});
    expect(normalizeNotificationPreferences("invalid")).toEqual({});
  });

  it("conserve les préférences activées et désactivées", () => {
    expect(normalizeNotificationPreferences({
      payment_received: true,
      membership_expiring: false,
      malformed: 0,
      truthy: "yes",
    })).toEqual({
      payment_received: true,
      membership_expiring: false,
      malformed: true,
      truthy: true,
    });
  });

  it("classe les adhésions échues ou proches de l’échéance", () => {
    const now = new Date("2026-08-20T12:00:00.000Z");
    expect(getMembershipReminderKind({ expiration: "2026-08-19T12:00:00.000Z", status: "expired" }, now)).toBe("overdue");
    expect(getMembershipReminderKind({ expiration: "2026-08-25T12:00:00.000Z", status: "pending" }, now)).toBe("expiring_soon");
    expect(getMembershipReminderKind({ expiration: "2026-09-15T12:00:00.000Z", status: "pending" }, now)).toBeNull();
    expect(getMembershipReminderKind({ expiration: "2026-08-19T12:00:00.000Z", status: "active" }, now)).toBeNull();
  });

  it("utilise un format d’événement stable pour l’idempotence", () => {
    const eventKey = "membership.expiring";
    const entityId = 42;
    const dedupeKey = `${eventKey}:${entityId}:2026-08-20`;
    expect(dedupeKey).toBe("membership.expiring:42:2026-08-20");
    expect(dedupeKey).toBe(`${eventKey}:${entityId}:2026-08-20`);
  });
});
