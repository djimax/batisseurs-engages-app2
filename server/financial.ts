import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { taxReceipts } from "../drizzle/schema";
import { getDb } from "./db";

export const EURO_TO_XOF = 655.957;
export const FINANCIAL_CURRENCIES = ["EUR", "XOF"] as const;
export type FinancialCurrency = (typeof FINANCIAL_CURRENCIES)[number];

export function parseFinancialAmount(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Le montant doit être un nombre positif.");
  }
  return Math.round(amount * 100) / 100;
}

export function convertFinancialAmount(amount: number, from: FinancialCurrency, to: FinancialCurrency) {
  if (from === to) return Math.round(amount * 100) / 100;
  const converted = from === "EUR" ? amount * EURO_TO_XOF : amount / EURO_TO_XOF;
  return Math.round(converted * 100) / 100;
}

export function formatFinancialAmount(amount: number, currency: FinancialCurrency) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: currency === "XOF" ? 0 : 2,
    maximumFractionDigits: currency === "XOF" ? 0 : 2,
  }).format(amount) + (currency === "EUR" ? " €" : " F CFA");
}

export function buildDonationDocumentHtml(input: {
  documentTitle: string;
  receiptNumber: string;
  donorName: string;
  donorEmail?: string | null;
  amount: number;
  currency: FinancialCurrency;
  donationDate: string;
  associationName: string;
  legalMention?: string | null;
}) {
  const equivalentCurrency: FinancialCurrency = input.currency === "EUR" ? "XOF" : "EUR";
  const equivalent = convertFinancialAmount(input.amount, input.currency, equivalentCurrency);
  const date = new Date(input.donationDate).toLocaleDateString("fr-FR");
  const legalMention = input.legalMention?.trim() || "Document généré par la plateforme. Vérifiez les conditions fiscales applicables auprès du responsable légal de l’association avant toute déclaration.";

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(input.documentTitle)} · ${escapeHtml(input.receiptNumber)}</title>
<style>body{font-family:Arial,sans-serif;color:#123b38;margin:48px;line-height:1.5}header{border-bottom:3px solid #f27c62;padding-bottom:18px;margin-bottom:28px}h1{margin:0 0 8px;font-size:28px}h2{color:#0b6b62;font-size:18px}table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:11px 0;border-bottom:1px solid #dce7e3}td:last-child{text-align:right;font-weight:700}.notice{background:#fff2ed;border-left:4px solid #f27c62;padding:14px;margin-top:28px;font-size:12px}.footer{margin-top:52px;font-size:12px;color:#55716c}@media print{body{margin:24mm}}</style></head>
<body><header><h1>${escapeHtml(input.documentTitle)}</h1><div>${escapeHtml(input.associationName)}</div></header>
<p><strong>Référence :</strong> ${escapeHtml(input.receiptNumber)}</p><p><strong>Date du don :</strong> ${escapeHtml(date)}</p>
<h2>Donateur</h2><p>${escapeHtml(input.donorName)}${input.donorEmail ? `<br>${escapeHtml(input.donorEmail)}` : ""}</p>
<h2>Montant reçu</h2><table><tr><td>Montant déclaré</td><td>${escapeHtml(formatFinancialAmount(input.amount, input.currency))}</td></tr><tr><td>Équivalence indicative</td><td>${escapeHtml(formatFinancialAmount(equivalent, equivalentCurrency))}</td></tr></table>
<div class="notice">${escapeHtml(legalMention)}</div><p class="footer">Ce document est un justificatif interne généré à partir des informations enregistrées dans l’association. Il doit être vérifié et signé selon les procédures applicables.</p>
<script>window.addEventListener('load',()=>window.print())</script></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] ?? character));
}

export async function createTaxReceipt(input: {
  documentType: "tax_receipt" | "donation_certificate";
  donorName: string;
  donorEmail?: string | null;
  amount: string | number;
  currency: FinancialCurrency;
  donationDate: string;
  issuedBy: number;
  associationName: string;
  legalMention?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const amount = parseFinancialAmount(input.amount);
  const receiptNumber = `RFD-${new Date(input.donationDate).getFullYear()}-${nanoid(10).toUpperCase()}`;
  const result = await db.insert(taxReceipts).values({
    receiptNumber,
    documentType: input.documentType,
    donorName: input.donorName.trim(),
    donorEmail: input.donorEmail?.trim() || null,
    amount: amount.toFixed(2),
    currency: input.currency,
    donationDate: input.donationDate,
    issuedBy: input.issuedBy,
    pdfUrl: null,
  });
  const documentHtml = buildDonationDocumentHtml({
    documentTitle: input.documentType === "tax_receipt" ? "Reçu fiscal de don" : "Certificat de don",
    receiptNumber,
    donorName: input.donorName,
    donorEmail: input.donorEmail,
    amount,
    currency: input.currency,
    donationDate: input.donationDate,
    associationName: input.associationName,
    legalMention: input.legalMention,
  });
  return { id: Number(result[0].insertId), receiptNumber, documentType: input.documentType, amount, currency: input.currency, equivalentAmount: convertFinancialAmount(amount, input.currency, input.currency === "EUR" ? "XOF" : "EUR"), documentHtml };
}

export async function listTaxReceipts(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taxReceipts).orderBy(desc(taxReceipts.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}

export async function getTaxReceiptById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(taxReceipts).where(eq(taxReceipts.id, id)).limit(1);
  return rows[0];
}
