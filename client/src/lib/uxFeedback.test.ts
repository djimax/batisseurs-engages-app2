import { describe, expect, it } from "vitest";
import { getErrorMessage } from "./uxFeedback";

describe("getErrorMessage", () => {
  it("retourne le message d'une erreur native", () => {
    expect(getErrorMessage(new Error("Échec réseau"), "Erreur générique")).toBe("Échec réseau");
  });

  it("retourne une chaîne d'erreur non vide", () => {
    expect(getErrorMessage("Accès refusé", "Erreur générique")).toBe("Accès refusé");
  });

  it("ignore les valeurs vides et utilise le fallback", () => {
    expect(getErrorMessage(new Error("   "), "Erreur générique")).toBe("Erreur générique");
    expect(getErrorMessage(null, "Erreur générique")).toBe("Erreur générique");
  });
});
