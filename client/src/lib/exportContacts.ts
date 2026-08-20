/**
 * Utilitaire pour exporter les contacts en CSV ou Excel
 */

export interface ContactExportData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  segment: string | null;
  status: string;
  company?: string | null;
  createdAt: Date | string;
  engagementScore?: number | null;
}

/**
 * Exporte les contacts en CSV
 */
export function exportContactsToCSV(contacts: ContactExportData[], filename: string = "contacts.csv") {
  const headers = [
    "ID",
    "Prénom",
    "Nom",
    "Email",
    "Téléphone",
    "Segment",
    "Statut",
    "Entreprise",
    "Date d'ajout",
    "Score d'engagement",
  ];

  const rows = contacts.map((contact) => [
    contact.id,
    contact.firstName,
    contact.lastName,
    contact.email,
    contact.phone || "",
    contact.segment || "",
    contact.status,
    contact.company || "",
    new Date(contact.createdAt).toLocaleDateString("fr-FR"),
    contact.engagementScore || "",
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    ),
  ].join("\n");

  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

  downloadFile(blob, filename);
}

/**
 * Exporte les contacts en Excel (XLSX)
 */
export async function exportContactsToExcel(
  contacts: ContactExportData[],
  filename: string = "contacts.xlsx"
) {
  try {
    // Dynamically import xlsx library
    const XLSX = await import("xlsx");

    const headers = [
      "ID",
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Segment",
      "Statut",
      "Entreprise",
      "Date d'ajout",
      "Score d'engagement",
    ];

    const data = contacts.map((contact) => [
      contact.id,
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.phone || "",
      contact.segment || "",
      contact.status,
      contact.company || "",
      new Date(contact.createdAt).toLocaleDateString("fr-FR"),
      contact.engagementScore || "",
    ]);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Set column widths
    ws["!cols"] = [
      { wch: 8 },  // ID
      { wch: 15 }, // Prénom
      { wch: 15 }, // Nom
      { wch: 25 }, // Email
      { wch: 15 }, // Téléphone
      { wch: 15 }, // Segment
      { wch: 12 }, // Statut
      { wch: 20 }, // Entreprise
      { wch: 15 }, // Date d'ajout
      { wch: 15 }, // Score d'engagement
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");

    // Generate file
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    // Fallback to CSV if xlsx is not available
    exportContactsToCSV(contacts, filename.replace(".xlsx", ".csv"));
  }
}

/**
 * Télécharge un fichier
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Génère un nom de fichier avec la date actuelle
 */
export function generateExportFilename(format: "csv" | "xlsx" = "csv"): string {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `contacts_${dateStr}_${timeStr}.${format}`;
}
