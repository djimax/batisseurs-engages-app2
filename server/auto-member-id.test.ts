import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDb } from "./db";
import { members } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Automatic Member ID Generation", () => {
  let db: any;

  beforeEach(async () => {
    db = await getDb();
  });

  afterEach(async () => {
    // Clean up test data
    if (db) {
      await db.delete(members).where(eq(members.firstName, "Test"));
    }
  });

  it("should generate memberID automatically when creating a member without memberID", async () => {
    const { createMember } = await import("./db");
    
    const result = await createMember({
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "+33600000000",
      gender: "1",
      memberID: "", // Empty memberID should trigger generation
      role: "Membre",
      function: "Testeur",
      status: "active" as const,
      memberRole: "member" as const,
    } as any);

    expect(result.memberID).toBeDefined();
    expect(result.memberID).toMatch(/^1-\d{2}-\d{2}-\d{4}$/);
  });

  it("should generate different order numbers for members with same gender and date", async () => {
    const { createMember } = await import("./db");
    
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = String(today.getFullYear()).slice(-2);

    const result1 = await createMember({
      firstName: "Test",
      lastName: "User1",
      email: "test1@example.com",
      phone: "+33600000001",
      gender: "1",
      memberID: "",
      role: "Membre",
      function: "Testeur",
      status: "active" as const,
      memberRole: "member" as const,
      joinedAt: today,
    } as any);

    const result2 = await createMember({
      firstName: "Test",
      lastName: "User2",
      email: "test2@example.com",
      phone: "+33600000002",
      gender: "1",
      memberID: "",
      role: "Membre",
      function: "Testeur",
      status: "active" as const,
      memberRole: "member" as const,
      joinedAt: today,
    } as any);

    expect(result1.memberID).toBeDefined();
    expect(result2.memberID).toBeDefined();
    
    // Extract order numbers
    const order1 = parseInt(result1.memberID.split("-")[3]);
    const order2 = parseInt(result2.memberID.split("-")[3]);
    
    expect(order2).toBeGreaterThan(order1);
  });

  it("should use provided memberID if given", async () => {
    const { createMember } = await import("./db");
    
    const customID = "1-05-26-9999";
    const result = await createMember({
      firstName: "Test",
      lastName: "Custom",
      email: "custom@example.com",
      phone: "+33600000003",
      gender: "1",
      memberID: customID,
      role: "Membre",
      function: "Testeur",
      status: "active" as const,
      memberRole: "member" as const,
    } as any);

    expect(result.memberID).toBe(customID);
  });

  it("should generate memberID with correct gender code", async () => {
    const { createMember } = await import("./db");
    
    // Test female (gender: 2)
    const result = await createMember({
      firstName: "Test",
      lastName: "Female",
      email: "female@example.com",
      phone: "+33600000004",
      gender: "2",
      memberID: "",
      role: "Membre",
      function: "Testeur",
      status: "active" as const,
      memberRole: "member" as const,
    } as any);

    expect(result.memberID).toBeDefined();
    expect(result.memberID.startsWith("2-")).toBe(true);
  });

  it("should generate memberID with correct month and year", async () => {
    const { createMember } = await import("./db");
    
    const testDate = new Date(2026, 4, 15); // May 15, 2026
    const result = await createMember({
      firstName: "Test",
      lastName: "Date",
      email: "date@example.com",
      phone: "+33600000005",
      gender: "1",
      memberID: "",
      role: "Membre",
      function: "Testeur",
      status: "active" as const,
      memberRole: "member" as const,
      joinedAt: testDate,
    } as any);

    expect(result.memberID).toBeDefined();
    // Should contain 05 for May and 26 for 2026
    expect(result.memberID).toMatch(/^1-05-26-\d{4}$/);
  });

  it("should handle gender default value of 3", async () => {
    const { createMember } = await import("./db");
    
    const result = await createMember({
      firstName: "Test",
      lastName: "Default",
      email: "default@example.com",
      phone: "+33600000006",
      gender: "3", // Default gender
      memberID: "",
      role: "Membre",
      function: "Testeur",
      status: "active" as const,
      memberRole: "member" as const,
    } as any);

    expect(result.memberID).toBeDefined();
    expect(result.memberID.startsWith("3-")).toBe(true);
  });
});
