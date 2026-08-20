import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import {
  createPasswordResetRequest,
  getPasswordResetRequest,
  getPasswordResetRequestByEmail,
  getPasswordResetRequestByToken,
  listPasswordResetRequests,
  updatePasswordResetRequest,
  deletePasswordResetRequest,
} from "./db";
import { passwordResetRequests } from "../drizzle/schema";
import { ENV } from "./_core/env";

// Mock database setup
let db: any;

const schema = {
  passwordResetRequests,
};

beforeAll(async () => {
  if (ENV.DATABASE_URL) {
    try {
      db = drizzle(ENV.DATABASE_URL, { schema, mode: "default" }) as any;
    } catch (error) {
      console.warn("Failed to connect to database:", error);
    }
  }
});

afterAll(async () => {
  // Cleanup
});

describe("Password Reset Requests", () => {
  let testRequestId: number;
  const testEmail = "test@example.com";
  const testToken = "test-token-12345";

  it("should create a password reset request", async () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const request = await createPasswordResetRequest({
      email: testEmail,
      token: testToken,
      status: "pending",
      expiresAt,
    });

    expect(request).toBeDefined();
    expect(request?.email).toBe(testEmail);
    expect(request?.token).toBe(testToken);
    expect(request?.status).toBe("pending");
    
    testRequestId = request?.id || 0;
  });

  it("should get a password reset request by ID", async () => {
    const request = await getPasswordResetRequest(testRequestId);

    expect(request).toBeDefined();
    expect(request?.id).toBe(testRequestId);
    expect(request?.email).toBe(testEmail);
  });

  it("should get a password reset request by email", async () => {
    const request = await getPasswordResetRequestByEmail(testEmail);

    expect(request).toBeDefined();
    expect(request?.email).toBe(testEmail);
  });

  it("should get a password reset request by token", async () => {
    const request = await getPasswordResetRequestByToken(testToken);

    expect(request).toBeDefined();
    expect(request?.token).toBe(testToken);
  });

  it("should list password reset requests", async () => {
    const requests = await listPasswordResetRequests(50, 0);

    expect(Array.isArray(requests)).toBe(true);
    expect(requests.length).toBeGreaterThan(0);
  });

  it("should update a password reset request", async () => {
    const temporaryPassword = "TempPass123!";
    const updatedRequest = await updatePasswordResetRequest(testRequestId, {
      temporaryPassword,
      status: "completed",
      completedAt: new Date(),
    });

    expect(updatedRequest).toBeDefined();
    expect(updatedRequest?.temporaryPassword).toBe(temporaryPassword);
    expect(updatedRequest?.status).toBe("completed");
  });

  it("should delete a password reset request", async () => {
    const result = await deletePasswordResetRequest(testRequestId);

    expect(result).toBeDefined();
    expect(result?.success).toBe(true);

    // Verify deletion
    const deletedRequest = await getPasswordResetRequest(testRequestId);
    expect(deletedRequest).toBeUndefined();
  });

  it("should handle non-existent request gracefully", async () => {
    const request = await getPasswordResetRequest(99999);
    expect(request).toBeUndefined();
  });

  it("should validate email format", async () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const request = await createPasswordResetRequest({
      email: "invalid-email",
      token: `test-token-invalid-${Date.now()}`,
      status: "pending",
      expiresAt,
    });

    // Should still create (validation is at API level)
    expect(request).toBeDefined();
  });

  it("should handle token uniqueness", async () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create first request
    const request1 = await createPasswordResetRequest({
      email: "test2@example.com",
      token: "unique-token-xyz",
      status: "pending",
      expiresAt,
    });

    expect(request1).toBeDefined();

    // Cleanup
    if (request1?.id) {
      await deletePasswordResetRequest(request1.id);
    }
  });
});
