import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("member portal clarity contract", () => {
  it("explains the purpose of the member profile with a concrete example", () => {
    const page = readFileSync(new URL("../client/src/pages/MemberPortal.tsx", import.meta.url), "utf8");
    expect(page).toContain("À quoi sert cet espace ?");
    expect(page).toContain("Exemple :");
    expect(page).toContain("Mon profil adhérent");
  });

  it("keeps the view switch accessible and explicit", () => {
    const component = readFileSync(new URL("../client/src/components/ViewModeToggle.tsx", import.meta.url), "utf8");
    expect(component).toContain('aria-pressed={value === "list"}');
    expect(component).toContain('aria-pressed={value === "grid"}');
    expect(component).toContain("Liste");
    expect(component).toContain("Damier");
  });
});
