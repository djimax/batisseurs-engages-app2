import { describe, it, expect, beforeEach } from "vitest";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  getAdminCount,
  isUserAdmin,
} from "./db";

describe("User Role Management", () => {
  describe("getAllUsers", () => {
    it("should return all users from database", async () => {
      const users = await getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });

    it("should include user id, email, and role", async () => {
      const users = await getAllUsers();
      if (users.length > 0) {
        const user = users[0];
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
      }
    });
  });

  describe("getUserById", () => {
    it("should return user by id", async () => {
      const users = await getAllUsers();
      if (users.length > 0) {
        const userId = users[0].id;
        const user = await getUserById(userId);
        expect(user).toBeDefined();
        expect(user?.id).toBe(userId);
      }
    });

    it("should return undefined for non-existent user", async () => {
      const user = await getUserById(99999);
      expect(user).toBeUndefined();
    });
  });

  describe("getAdminCount", () => {
    it("should return number of admins", async () => {
      const count = await getAdminCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should always have at least one admin", async () => {
      const count = await getAdminCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe("isUserAdmin", () => {
    it("should return boolean for user admin status", async () => {
      const users = await getAllUsers();
      if (users.length > 0) {
        const userId = users[0].id;
        const isAdmin = await isUserAdmin(userId);
        expect(typeof isAdmin).toBe("boolean");
      }
    });

    it("should correctly identify admin users", async () => {
      const users = await getAllUsers();
      const adminUser = users.find((u) => u.role === "admin");
      if (adminUser) {
        const isAdmin = await isUserAdmin(adminUser.id);
        expect(isAdmin).toBe(true);
      }
    });

    it("should correctly identify non-admin users", async () => {
      const users = await getAllUsers();
      const nonAdminUser = users.find((u) => u.role === "user");
      if (nonAdminUser) {
        const isAdmin = await isUserAdmin(nonAdminUser.id);
        expect(isAdmin).toBe(false);
      }
    });
  });

  describe("updateUserRole", () => {
    it("should prevent removing last admin", async () => {
      const adminCount = await getAdminCount();
      if (adminCount === 1) {
        const users = await getAllUsers();
        const adminUser = users.find((u) => u.role === "admin");
        if (adminUser) {
          await expect(updateUserRole(adminUser.id, "user")).rejects.toThrow(
            "Il doit y avoir au moins un administrateur"
          );
        }
      }
    });

    it("should allow changing role when multiple admins exist", async () => {
      const adminCount = await getAdminCount();
      if (adminCount > 1) {
        const users = await getAllUsers();
        const adminUser = users.find((u) => u.role === "admin");
        if (adminUser) {
          // This should succeed
          await expect(updateUserRole(adminUser.id, "user")).resolves.not.toThrow();
          // Restore the role
          await updateUserRole(adminUser.id, "admin");
        }
      }
    });

    it("should allow promoting user to admin", async () => {
      const users = await getAllUsers();
      const nonAdminUser = users.find((u) => u.role === "user");
      if (nonAdminUser) {
        await expect(updateUserRole(nonAdminUser.id, "admin")).resolves.not.toThrow();
        // Restore the role
        await updateUserRole(nonAdminUser.id, "user");
      }
    });
  });
});
