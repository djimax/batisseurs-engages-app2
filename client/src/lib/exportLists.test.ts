import { describe, expect, it } from "vitest";
import { buildCsv, generateListExportFilename, type ExportColumn } from "./exportLists";

type Row = { name: string; city: string; note: string };

const columns: ExportColumn<Row>[] = [
  { header: "Nom", value: (row) => row.name },
  { header: "Ville", value: (row) => row.city },
  { header: "Note", value: (row) => row.note },
];

describe("exportLists", () => {
  it("génère un CSV avec les en-têtes et échappe les valeurs complexes", () => {
    const csv = buildCsv(
      [{ name: "Antenne Paris", city: "Paris", note: 'Rue, de la Paix' }],
      columns,
    );

    expect(csv).toBe('Nom,Ville,Note\nAntenne Paris,Paris,"Rue, de la Paix"');
  });

  it("préserve les retours à la ligne et les guillemets dans un CSV", () => {
    const csv = buildCsv(
      [{ name: "Groupe", city: "Lyon", note: 'Ligne 1\nLigne "2"' }],
      columns,
    );

    expect(csv).toContain('"Ligne 1\nLigne ""2"""');
  });

  it("génère des extensions d’export cohérentes", () => {
    expect(generateListExportFilename("antennes", "csv")).toMatch(/^antennes_\d{4}-\d{2}-\d{2}\.csv$/);
    expect(generateListExportFilename("projets", "pdf")).toMatch(/^projets_\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
