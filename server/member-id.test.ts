import { describe, it, expect } from "vitest";
import {
  generateMemberId,
  parseMemberId,
  isValidMemberId,
  getNextOrderNumber,
  formatGenderDisplay,
  parseGenderDisplay,
} from "../shared/memberIdGenerator";

describe("Member ID Generator", () => {
  describe("generateMemberId", () => {
    it("should generate a valid member ID for a male member", () => {
      const date = new Date("2026-05-15");
      const id = generateMemberId("male", date, 1);
      expect(id).toBe("1-05-26-0001");
    });

    it("should generate a valid member ID for a female member", () => {
      const date = new Date("2026-05-15");
      const id = generateMemberId("female", date, 2);
      expect(id).toBe("2-05-26-0002");
    });

    it("should generate a valid member ID for other gender", () => {
      const date = new Date("2026-05-15");
      const id = generateMemberId("other", date, 3);
      expect(id).toBe("3-05-26-0003");
    });

    it("should pad order number with zeros", () => {
      const date = new Date("2026-05-15");
      const id = generateMemberId("male", date, 42);
      expect(id).toBe("1-05-26-0042");
    });

    it("should handle January correctly", () => {
      const date = new Date("2026-01-15");
      const id = generateMemberId("male", date, 1);
      expect(id).toBe("1-01-26-0001");
    });

    it("should handle December correctly", () => {
      const date = new Date("2026-12-15");
      const id = generateMemberId("male", date, 1);
      expect(id).toBe("1-12-26-0001");
    });
  });

  describe("parseMemberId", () => {
    it("should parse a valid member ID", () => {
      const result = parseMemberId("1-05-26-0002");
      expect(result.gender).toBe("male");
      expect(result.month).toBe(5);
      expect(result.year).toBe(26);
      expect(result.order).toBe(2);
      expect(result.genderCode).toBe("1");
    });

    it("should parse female member ID", () => {
      const result = parseMemberId("2-03-25-0015");
      expect(result.gender).toBe("female");
      expect(result.month).toBe(3);
      expect(result.year).toBe(25);
      expect(result.order).toBe(15);
    });

    it("should parse other gender member ID", () => {
      const result = parseMemberId("3-12-24-0099");
      expect(result.gender).toBe("other");
      expect(result.month).toBe(12);
      expect(result.year).toBe(24);
      expect(result.order).toBe(99);
    });

    it("should throw error for invalid format", () => {
      expect(() => parseMemberId("invalid")).toThrow();
      expect(() => parseMemberId("1-05-26")).toThrow();
      expect(() => parseMemberId("1-05-26-0001-extra")).toThrow();
    });
  });

  describe("isValidMemberId", () => {
    it("should validate a correct member ID", () => {
      expect(isValidMemberId("1-05-26-0001")).toBe(true);
      expect(isValidMemberId("2-03-25-0015")).toBe(true);
      expect(isValidMemberId("3-12-24-0099")).toBe(true);
    });

    it("should reject invalid gender code", () => {
      expect(isValidMemberId("4-05-26-0001")).toBe(false);
      expect(isValidMemberId("0-05-26-0001")).toBe(false);
    });

    it("should reject invalid month", () => {
      expect(isValidMemberId("1-00-26-0001")).toBe(false);
      expect(isValidMemberId("1-13-26-0001")).toBe(false);
    });

    it("should reject invalid year", () => {
      expect(isValidMemberId("1-05-100-0001")).toBe(false);
      expect(isValidMemberId("1-05--1-0001")).toBe(false);
    });

    it("should reject invalid order", () => {
      expect(isValidMemberId("1-05-26-0000")).toBe(false);
      expect(isValidMemberId("1-05-26-10000")).toBe(false);
    });

    it("should reject malformed IDs", () => {
      expect(isValidMemberId("invalid")).toBe(false);
      expect(isValidMemberId("1-05-26")).toBe(false);
      expect(isValidMemberId("1-05-26-0001-extra")).toBe(false);
    });
  });

  describe("getNextOrderNumber", () => {
    it("should return 1 for first member", () => {
      expect(getNextOrderNumber(0)).toBe(1);
    });

    it("should return 2 for second member", () => {
      expect(getNextOrderNumber(1)).toBe(2);
    });

    it("should return correct order for multiple members", () => {
      expect(getNextOrderNumber(42)).toBe(43);
      expect(getNextOrderNumber(9999)).toBe(10000);
    });
  });

  describe("formatGenderDisplay", () => {
    it("should format male to Homme", () => {
      expect(formatGenderDisplay("male")).toBe("Homme");
    });

    it("should format female to Femme", () => {
      expect(formatGenderDisplay("female")).toBe("Femme");
    });

    it("should format other to Autre", () => {
      expect(formatGenderDisplay("other")).toBe("Autre");
    });
  });

  describe("parseGenderDisplay", () => {
    it("should parse Homme to male", () => {
      expect(parseGenderDisplay("Homme")).toBe("male");
    });

    it("should parse Femme to female", () => {
      expect(parseGenderDisplay("Femme")).toBe("female");
    });

    it("should parse Autre to other", () => {
      expect(parseGenderDisplay("Autre")).toBe("other");
    });

    it("should default to other for unknown input", () => {
      expect(parseGenderDisplay("Unknown")).toBe("other");
    });
  });

  describe("Round-trip conversion", () => {
    it("should generate and parse correctly", () => {
      const date = new Date("2026-05-15");
      const generated = generateMemberId("male", date, 42);
      const parsed = parseMemberId(generated);

      expect(parsed.gender).toBe("male");
      expect(parsed.month).toBe(5);
      expect(parsed.year).toBe(26);
      expect(parsed.order).toBe(42);
    });

    it("should validate generated IDs", () => {
      const date = new Date("2026-05-15");
      const id = generateMemberId("female", date, 123);
      expect(isValidMemberId(id)).toBe(true);
    });
  });
});
