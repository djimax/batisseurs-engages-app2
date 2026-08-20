import { describe, expect, it } from "vitest";
import {
  assertPermission,
  canAccessScope,
  hasRequiredAccess,
  type ScopeGrant,
} from "./authorization";

describe("authorization helpers", () => {
  it("compare correctement les niveaux d’accès", () => {
    expect(hasRequiredAccess("manager", "viewer")).toBe(true);
    expect(hasRequiredAccess("editor", "editor")).toBe(true);
    expect(hasRequiredAccess("viewer", "editor")).toBe(false);
  });

  it("autorise un accès national sur tous les périmètres", () => {
    const grants: ScopeGrant[] = [
      { scopeType: "national", scopeId: null, accessLevel: "viewer" },
    ];

    expect(canAccessScope(grants, "antenne", 12, "viewer")).toBe(true);
    expect(canAccessScope(grants, "project", 42, "manager")).toBe(false);
  });

  it("autorise uniquement le périmètre attribué", () => {
    const grants: ScopeGrant[] = [
      { scopeType: "antenne", scopeId: 12, accessLevel: "editor" },
    ];

    expect(canAccessScope(grants, "antenne", 12, "viewer")).toBe(true);
    expect(canAccessScope(grants, "antenne", 12, "manager")).toBe(false);
    expect(canAccessScope(grants, "antenne", 13, "viewer")).toBe(false);
    expect(canAccessScope(grants, "groupe", 12, "viewer")).toBe(false);
  });

  it("accepte le contournement explicite pour l’administrateur système", async () => {
    await expect(assertPermission({ id: 1, role: "admin" }, "admin.scopes.manage")).resolves.toBeUndefined();
  });
});
