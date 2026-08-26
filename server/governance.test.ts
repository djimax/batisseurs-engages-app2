import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assemblyCreateSchema, calculateQuorum } from "./governance-router";

describe("governance", () => {
  it("centralise l’audit des décisions de gouvernance", () => {
    const source = readFileSync(new URL("./governance-router.ts", import.meta.url), "utf8");
    expect(source).toContain('entityType: "assembly"');
    expect(source).toContain('entityType: "assembly_resolution"');
    expect(source).toContain('entityType: "assembly_proxy"');
    expect(source).toContain('entityType: "assembly_vote"');
  });

  describe("calculateQuorum", () => {
    it("atteint le quorum quand la présence dépasse le seuil", () => {
      expect(calculateQuorum(10, 6, 50)).toMatchObject({
        eligibleCount: 10,
        presentCount: 6,
        attendancePercentage: 60,
        reached: true,
      });
    });

    it("n’atteint pas le quorum sous le seuil", () => {
      expect(calculateQuorum(10, 4, 50)).toMatchObject({
        attendancePercentage: 40,
        reached: false,
      });
    });

    it("gère une assemblée sans membre éligible sans division par zéro", () => {
      expect(calculateQuorum(0, 0, 50)).toMatchObject({
        attendancePercentage: 0,
        reached: false,
      });
    });

    it("borne les valeurs de présence incohérentes", () => {
      expect(calculateQuorum(-2, 12, 50)).toMatchObject({
        eligibleCount: 0,
        presentCount: 0,
        reached: false,
      });
    });
  });

  describe("assemblyCreateSchema", () => {
    it("applique les valeurs par défaut métier", () => {
      expect(assemblyCreateSchema.parse({ title: "Assemblée annuelle" })).toMatchObject({
        type: "ordinary",
        quorumPercentage: 50,
      });
    });

    it("refuse un quorum hors de l’intervalle autorisé", () => {
      expect(() => assemblyCreateSchema.parse({ title: "AG", quorumPercentage: 101 })).toThrow();
    });
  });
});
