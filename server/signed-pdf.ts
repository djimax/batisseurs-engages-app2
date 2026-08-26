import { jsPDF } from "jspdf";
import type { SignedPdfData } from "../client/src/lib/signedPdf";

function formatDate(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString("fr-FR") : "—";
}

export function buildSignedDocumentPdf(data: SignedPdfData): Buffer {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  let y = 18;
  const ensureSpace = (needed = 12) => { if (y + needed > height - 16) { pdf.addPage(); y = 18; } };
  const heading = (text: string, size = 13) => { ensureSpace(16); pdf.setFont("helvetica", "bold"); pdf.setFontSize(size); pdf.setTextColor(20, 79, 68); pdf.text(text, margin, y); y += 8; };
  const paragraph = (label: string, value: string) => { const lines = pdf.splitTextToSize(`${label} ${value}`, width - margin * 2); ensureSpace(lines.length * 5 + 4); pdf.setFont("helvetica", "normal"); pdf.setFontSize(9); pdf.setTextColor(45, 55, 52); pdf.text(lines, margin, y); y += lines.length * 5 + 2; };

  pdf.setFillColor(232, 244, 237); pdf.rect(0, 0, width, 34, "F");
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(18); pdf.setTextColor(7, 94, 80); pdf.text("Les Bâtisseurs Engagés", margin, 15);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text("Preuve de signature électronique", margin, 23); y = 48;
  heading(data.request.subject, 16);
  paragraph("Document :", data.document.title);
  paragraph("Identifiant :", String(data.document.id));
  paragraph("Fichier source :", data.document.fileName ?? "Aucun fichier associé");
  paragraph("Statut :", data.request.status === "completed" ? "Entièrement signé" : data.request.status);
  paragraph("Finalisé le :", formatDate(data.request.completedAt));
  heading("Empreinte d’intégrité", 12);
  pdf.setFont("courier", "normal"); pdf.setFontSize(8); pdf.setTextColor(35, 70, 62); const hashLines = pdf.splitTextToSize(data.request.documentHash, width - margin * 2); ensureSpace(hashLines.length * 5 + 6); pdf.text(hashLines, margin, y); y += hashLines.length * 5 + 6;
  heading("Signataires", 12);
  for (const signer of data.request.signers) { paragraph("Nom :", signer.signerName); paragraph("E-mail :", signer.signerEmail); paragraph("Signature saisie :", signer.typedSignature ?? "—"); paragraph("Consentement :", formatDate(signer.consentAt)); paragraph("Signature :", formatDate(signer.signedAt)); paragraph("Empreinte de preuve :", signer.evidenceHash ?? "—"); }
  heading("Journal d’audit", 12);
  for (const entry of data.audit) paragraph(`${formatDate(entry.createdAt)} — ${entry.action} :`, `${entry.description ?? "Événement de signature"} (${entry.status ?? "non précisé"})`);
  ensureSpace(18); pdf.setDrawColor(210, 225, 219); pdf.line(margin, y, width - margin, y); y += 7; pdf.setFont("helvetica", "italic"); pdf.setFontSize(8); pdf.setTextColor(100, 120, 113); pdf.text("Preuve générée automatiquement après finalisation de la demande.", margin, y);
  return Buffer.from(pdf.output("arraybuffer"));
}
