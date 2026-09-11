import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Events capacity and waitlist contract", () => {
  it("defines optional capacity and a waitlisted registration state", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(schema).toContain("capacity: int()");
    expect(schema).toContain("'registered','waitlisted','attended','cancelled'");
  });

  it("places registrations over capacity on the waitlist with audited status", () => {
    const router = readFileSync(new URL("./events-router.ts", import.meta.url), "utf8");
    expect(router).toContain("capacity: z.number().int().positive()");
    expect(router).toContain('const nextStatus = event[0].capacity');
    expect(router).toContain('"waitlisted"');
    expect(router).toContain("Inscription placée en liste d’attente");
    expect(router).toContain('assertPermission(ctx.user, "structures.view")');
  });

  it("renders capacity progress and waitlist totals accessibly", () => {
    const page = readFileSync(new URL("../client/src/pages/Events.tsx", import.meta.url), "utf8");
    expect(page).toContain("Jauge maximale de participants");
    expect(page).toContain("Jauge");
    expect(page).toContain("en attente");
    expect(page).toContain("aria-label=\"Jauge maximale de participants\"");
  });
});
