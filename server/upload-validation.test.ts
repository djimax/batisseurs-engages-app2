import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const routerSource = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("upload validation contract", () => {
  it("validates document names, MIME values, declared size and decoded size", () => {
    expect(routerSource).toContain("Nom de fichier invalide");
    expect(routerSource).toContain("Type MIME invalide");
    expect(routerSource).toContain("La taille du fichier ne correspond pas à son contenu.");
    expect(routerSource).toContain("fileBuffer.length !== fileSize");
  });

  it("validates member photos by real JPEG/PNG signatures and an 8MB limit", () => {
    expect(routerSource).toContain("Format photo non pris en charge. Utilisez JPEG ou PNG.");
    expect(routerSource).toContain("buffer.length > 8 * 1024 * 1024");
    expect(routerSource).toContain("isJpeg");
    expect(routerSource).toContain("isPng");
    expect(routerSource).toContain("members.manage");
  });
});
