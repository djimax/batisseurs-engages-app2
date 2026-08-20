export interface ExportColumn<T> {
  header: string;
  value: (row: T) => unknown;
  width?: number;
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("fr-FR");
  return String(value);
}

function escapeCsvCell(value: unknown): string {
  const cell = stringifyCell(value);
  return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

export function buildCsv<T>(rows: T[], columns: ExportColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsvCell(column.value(row))).join(","));
  return [header, ...body].join("\n");
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportRowsToCSV<T>(rows: T[], columns: ExportColumn<T>[], filename: string): void {
  const csv = buildCsv(rows, columns);
  downloadBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), filename);
}

export async function exportRowsToPDF<T>(
  title: string,
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const landscape = columns.length > 6;
  const document = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm" });
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const margin = 12;
  const tableTop = 32;
  const rowHeight = 8;
  const tableWidth = pageWidth - margin * 2;
  const defaultWidth = tableWidth / columns.length;
  const widths = columns.map((column) => column.width ?? defaultWidth);

  document.setFont("helvetica", "bold");
  document.setFontSize(16);
  document.setTextColor(26, 77, 46);
  document.text(title, margin, 14);
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.setTextColor(100, 100, 100);
  document.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, margin, 21);

  const drawHeader = (y: number) => {
    let x = margin;
    document.setFillColor(26, 77, 46);
    document.setTextColor(255, 255, 255);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    columns.forEach((column, index) => {
      document.rect(x, y, widths[index], rowHeight, "F");
      document.text(column.header, x + 2, y + 5.2, { maxWidth: widths[index] - 4 });
      x += widths[index];
    });
  };

  const drawRow = (row: T, y: number, rowIndex: number) => {
    let x = margin;
    document.setFillColor(rowIndex % 2 === 0 ? 248 : 255, rowIndex % 2 === 0 ? 250 : 255, rowIndex % 2 === 0 ? 249 : 255);
    document.setTextColor(35, 35, 35);
    document.setFont("helvetica", "normal");
    document.setFontSize(7.5);
    columns.forEach((column, index) => {
      document.rect(x, y, widths[index], rowHeight, "F");
      document.setDrawColor(225, 225, 225);
      document.rect(x, y, widths[index], rowHeight);
      document.text(stringifyCell(column.value(row)), x + 2, y + 5.2, { maxWidth: widths[index] - 4 });
      x += widths[index];
    });
  };

  let y = tableTop;
  drawHeader(y);
  y += rowHeight;
  rows.forEach((row, rowIndex) => {
    if (y + rowHeight > pageHeight - margin) {
      document.addPage();
      y = margin;
      drawHeader(y);
      y += rowHeight;
    }
    drawRow(row, y, rowIndex);
    y += rowHeight;
  });

  if (rows.length === 0) {
    document.setFont("helvetica", "italic");
    document.setTextColor(100, 100, 100);
    document.text("Aucune donnée à exporter", margin, y + 8);
  }

  document.save(filename);
}

export function generateListExportFilename(prefix: string, format: "csv" | "pdf"): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}_${date}.${format}`;
}
