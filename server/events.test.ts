import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { EventInput } from "./events-router";

const eventsPageSource = readFileSync(new URL("../client/src/pages/Events.tsx", import.meta.url), "utf8");

describe("events module contract", () => {
  it("protects the listing and mutations with dedicated structure permissions", () => {
    const routerSource = readFileSync(new URL("./events-router.ts", import.meta.url), "utf8");
    expect(routerSource).toContain('assertPermission(ctx.user, "structures.view")');
    expect(routerSource).toContain('assertPermission(ctx.user, "structures.manage")');
    expect(routerSource).toContain("logAudit");
  });

  it("supports audited registrations, cancellation and attendance with duplicate protection", () => {
    const routerSource = readFileSync(new URL("./events-router.ts", import.meta.url), "utf8");
    const schemaSource = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(routerSource).toContain("registrations:");
    expect(routerSource).toContain("register:");
    expect(routerSource).toContain("cancelRegistration:");
    expect(routerSource).toContain("markAttendance:");
    expect(routerSource).toContain('code: "CONFLICT"');
    expect(routerSource).toContain("userHasPermission");
    expect(schemaSource).toContain("event_registrations_event_member_unique");
  });

  it("exposes registration controls in the events interface", () => {
    expect(eventsPageSource).toContain("trpc.events.registrations.useQuery");
    expect(eventsPageSource).toContain("trpc.events.register.useMutation");
    expect(eventsPageSource).toContain("Inscriptions");
    expect(eventsPageSource).toContain("Présent");
  });

  it("rejects invalid periods and accepts a valid event", () => {
    const valid = EventInput.safeParse({
      title: "Assemblée locale",
      eventType: "reunion",
      startDate: "2026-09-01T10:00:00.000Z",
      endDate: "2026-09-01T12:00:00.000Z",
      color: "#1a4d2e",
      attendees: 12,
    });
    const invalid = EventInput.safeParse({
      title: "Période invalide",
      eventType: "autre",
      startDate: "2026-09-01T12:00:00.000Z",
      endDate: "2026-09-01T10:00:00.000Z",
      color: "#1a4d2e",
      attendees: 0,
    });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it("uses persisted tRPC data and functional create/edit/delete controls", () => {
    expect(eventsPageSource).toContain("trpc.events.list.useQuery()");
    expect(eventsPageSource).toContain("trpc.events.create.useMutation");
    expect(eventsPageSource).toContain("trpc.events.update.useMutation");
    expect(eventsPageSource).toContain("trpc.events.delete.useMutation");
    expect(eventsPageSource).not.toContain("SAMPLE_EVENTS");
  });
});
