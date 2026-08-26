export type SignedPdfData = {
  request: {
    id: number;
    subject: string;
    documentHash: string;
    status: string;
    completedAt: string | null;
    createdAt: string;
    signers: Array<{
      signerName: string;
      signerEmail: string;
      status: string;
      typedSignature: string | null;
      signedAt: string | null;
      consentAt: string | null;
      evidenceHash: string | null;
    }>;
  };
  document: {
    id: number;
    title: string;
    description: string | null;
    fileName: string | null;
    fileType: string | null;
    fileSize: number | null;
  };
  audit: Array<{
    action: string;
    description: string | null;
    status: string | null;
    createdAt: string;
    entityId: number | null;
  }>;
};

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

function downloadPdf(pdf: { save: (filename: string) => void }, filename: string) {
  pdf.save(filename);
}

export async function exportSignedDocumentPdf(data: SignedPdfData, filename: string): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  let y = 18;

  const ensureSpace = (needed = 12) => {
    if (y + needed > height - 16) {
      pdf.addPage();
      y = 18;
    }
  };
  const heading = (text: string, size = 14) => {
    ensureSpace(16);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(size);
    pdf.setTextColor(20, 79, 68);
    pdf.text(text, margin, y);
    y += size === 14 ? 9 : 7;
  };
  const paragraph = (label: string, value: string) => {
    const lines = pdf.splitTextToSize(`${label} ${value}`, width - margin * 2);
    ensureSpace(lines.length * 5 + 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(45, 55, 52);
    pdf.text(lines, margin, y);
    y += lines.length * 5 + 2;
  };

  pdf.setFillColor(232, 244, 237);
  pdf.rect(0, 0, width, 34, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(7, 94, 80);
  pdf.text("Les Bâtisseurs Engagés", margin, 15);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Certificat d’export du document signé", margin, 23);
  y = 48;

  heading(data.request.subject, 16);
  paragraph("Document :", data.document.title);
  paragraph("Identifiant :", String(data.document.id));
  paragraph("Fichier source :", data.document.fileName ?? "Aucun fichier associé");
  paragraph("Type :", data.document.fileType ?? "Non précisé");
  paragraph("Statut de signature :", data.request.status === "completed" ? "Entièrement signé" : data.request.status);
  paragraph("Demande créée le :", formatDate(data.request.createdAt));
  paragraph("Signature finalisée le :", formatDate(data.request.completedAt));

  heading("Empreinte d’intégrité", 12);
  pdf.setFillColor(246, 249, 247);
  const hashLines = pdf.splitTextToSize(data.request.documentHash, width - margin * 2 - 8);
  ensureSpace(hashLines.length * 5 + 12);
  pdf.roundedRect(margin, y - 4, width - margin * 2, hashLines.length * 5 + 10, 2, 2, "F");
  pdf.setFont("courier", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(35, 70, 62);
  pdf.text(hashLines, margin + 4, y + 2);
  y += hashLines.length * 5 + 14;

  heading("Signataires", 12);
  for (const signer of data.request.signers) {
    paragraph("Nom :", signer.signerName);
    paragraph("E-mail :", signer.signerEmail);
    paragraph("Signature saisie :", signer.typedSignature ?? "—");
    paragraph("Consentement horodaté :", formatDate(signer.consentAt));
    paragraph("Signature horodatée :", formatDate(signer.signedAt));
    paragraph("Empreinte de preuve :", signer.evidenceHash ?? "—");
    y += 2;
  }

  heading("Journal d’audit", 12);
  for (const entry of data.audit) {
    paragraph(`${formatDate(entry.createdAt)} — ${entry.action} :`, `${entry.description ?? "Événement de signature"} (${entry.status ?? "non précisé"})`);
  }

  ensureSpace(20);
  pdf.setDrawColor(210, 225, 219);
  pdf.line(margin, y, width - margin, y);
  y += 7;
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 120, 113);
  pdf.text("Export généré depuis la plateforme associative. La présente preuve décrit une signature électronique interne.", margin, y, { maxWidth: width - margin * 2 });

  downloadPdf(pdf, filename);
}
