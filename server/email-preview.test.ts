import { describe, expect, it } from "vitest";
import { buildEmailPreviewDocument, replaceEmailPreviewVariables } from "../client/src/lib/emailPreview";

describe("email preview renderer", () => {
  it("replaces known variables and preserves unknown placeholders", () => {
    expect(replaceEmailPreviewVariables("Bonjour {{firstName}} {{unknown}}", { firstName: "Marie" })).toBe("Bonjour Marie {{unknown}}");
  });

  it("escapes plain text and removes executable or remote markup", () => {
    const document = buildEmailPreviewDocument("Sujet {{firstName}}", "Bonjour <script>alert(1)</script><img src=\"https://tracking.example\" onerror=\"alert(1)\"> & merci");
    expect(document).toContain("Sujet Marie");
    expect(document).not.toContain("<script>");
    expect(document).not.toContain("onerror");
    expect(document).not.toContain("tracking.example");
    expect(document).toContain("&amp; merci");
  });

  it("does not create a send endpoint or network call in the preview document", () => {
    const document = buildEmailPreviewDocument("Test", "Contenu");
    expect(document).toContain("Aperçu local");
    expect(document).not.toContain("/api/");
    expect(document).not.toContain("fetch(");
  });
});
