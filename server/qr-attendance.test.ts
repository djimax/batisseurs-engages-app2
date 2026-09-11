import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("QR attendance contract", () => {
  it("stores a temporary revocable attendance token on events", () => {
    const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
    expect(schema).toContain("attendanceToken: varchar({ length: 128 })");
    expect(schema).toContain("attendanceTokenExpiresAt: timestamp");
    expect(schema).toContain("attendanceTokenRevoked: int().default(0).notNull()");
  });

  it("protects QR generation and validates expiry, revocation and ownership", () => {
    const router = readFileSync(new URL("./events-router.ts", import.meta.url), "utf8");
    expect(router).toContain("generateAttendanceToken: protectedProcedure");
    expect(router).toContain("revokeAttendanceToken: protectedProcedure");
    expect(router).toContain("checkInByToken: protectedProcedure");
    expect(router).toContain("randomBytes(32)");
    expect(router).toContain("attendanceTokenRevoked");
    expect(router).toContain("QR d’émargement est invalide ou expiré");
    expect(router).toContain("Émargement QR validé");
  });

  it("renders QR generation and revocation controls", () => {
    const page = readFileSync(new URL("../client/src/pages/Events.tsx", import.meta.url), "utf8");
    expect(page).toContain("Générer QR");
    expect(page).toContain("Révoquer le QR");
    expect(page).toContain("QR code temporaire pour émargement");
    expect(page).toContain("Émargement tablette");
  });
});
