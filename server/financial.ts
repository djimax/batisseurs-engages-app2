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

export function convertFinancialAmount(amount: number, from: FinancialCurrency, to: FinancialCurrency, euroToXofRate = EURO_TO_XOF) {
  if (from === to) return Math.round(amount * 100) / 100;
  const rate = Number.isFinite(euroToXofRate) && euroToXofRate > 0 ? euroToXofRate : EURO_TO_XOF;
  const converted = from === "EUR" ? amount * rate : amount / rate;
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

export type FinancialReportEntry = {
  type: "cotisation" | "don" | "depense";
  amount: number;
  currency: FinancialCurrency;
  date: string;
};

export type FinancialReportPeriod = {
  period: string;
  income: number;
  expenses: number;
  balance: number;
  incomeXof: number;
  expensesXof: number;
  balanceXof: number;
  incomeEur: number;
  expensesEur: number;
  balanceEur: number;
};

/** Build a deterministic monthly report; XOF and EUR totals are both exposed. */
export type FinancialReportBreakdown = Record<FinancialReportEntry["type"], { amount: number; amountXof: number; amountEur: number }>;

export type FinancialReport = {
  year: number;
  monthly: FinancialReportPeriod[];
  total: FinancialReportPeriod;
  breakdown: FinancialReportBreakdown;
  comparison: { year: number; totalXof: number; totalEur: number; variationXof: number | null; variationEur: number | null } | null;
};

export function buildFinancialReport(entries: FinancialReportEntry[], year: number, compareYear?: number, euroToXofRate = EURO_TO_XOF): FinancialReport {
  const periods = new Map<string, FinancialReportPeriod>();
  const breakdown: FinancialReportBreakdown = {
    cotisation: { amount: 0, amountXof: 0, amountEur: 0 },
    don: { amount: 0, amountXof: 0, amountEur: 0 },
    depense: { amount: 0, amountXof: 0, amountEur: 0 },
  };
  const createPeriod = (period: string): FinancialReportPeriod => ({
    period,
    income: 0,
    expenses: 0,
    balance: 0,
    incomeXof: 0,
    expensesXof: 0,
    balanceXof: 0,
    incomeEur: 0,
    expensesEur: 0,
    balanceEur: 0,
  });

  for (const entry of entries) {
    const date = new Date(entry.date);
    if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() !== year) continue;
    const period = `${year}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const row = periods.get(period) ?? createPeriod(period);
    const amount = parseFinancialAmount(entry.amount);
    const isExpense = entry.type === "depense";
    const amountXof = convertFinancialAmount(amount, entry.currency, "XOF", euroToXofRate);
    const amountEur = convertFinancialAmount(amount, entry.currency, "EUR", euroToXofRate);
    breakdown[entry.type].amount = Math.round((breakdown[entry.type].amount + amount) * 100) / 100;
    breakdown[entry.type].amountXof = Math.round((breakdown[entry.type].amountXof + amountXof) * 100) / 100;
    breakdown[entry.type].amountEur = Math.round((breakdown[entry.type].amountEur + amountEur) * 100) / 100;
    if (isExpense) {
      row.expenses = Math.round((row.expenses + amount) * 100) / 100;
      row.expensesXof = Math.round((row.expensesXof + amountXof) * 100) / 100;
      row.expensesEur = Math.round((row.expensesEur + amountEur) * 100) / 100;
    } else {
      row.income = Math.round((row.income + amount) * 100) / 100;
      row.incomeXof = Math.round((row.incomeXof + amountXof) * 100) / 100;
      row.incomeEur = Math.round((row.incomeEur + amountEur) * 100) / 100;
    }
    row.balance = Math.round((row.income - row.expenses) * 100) / 100;
    row.balanceXof = Math.round((row.incomeXof - row.expensesXof) * 100) / 100;
    row.balanceEur = Math.round((row.incomeEur - row.expensesEur) * 100) / 100;
    periods.set(period, row);
  }

  const monthly = Array.from(periods.values()).sort((a, b) => a.period.localeCompare(b.period));
  const total = monthly.reduce((acc, row) => ({
    period: "total",
    income: Math.round((acc.income + row.income) * 100) / 100,
    expenses: Math.round((acc.expenses + row.expenses) * 100) / 100,
    balance: Math.round((acc.balance + row.balance) * 100) / 100,
    incomeXof: Math.round((acc.incomeXof + row.incomeXof) * 100) / 100,
    expensesXof: Math.round((acc.expensesXof + row.expensesXof) * 100) / 100,
    balanceXof: Math.round((acc.balanceXof + row.balanceXof) * 100) / 100,
    incomeEur: Math.round((acc.incomeEur + row.incomeEur) * 100) / 100,
    expensesEur: Math.round((acc.expensesEur + row.expensesEur) * 100) / 100,
    balanceEur: Math.round((acc.balanceEur + row.balanceEur) * 100) / 100,
  }), createPeriod("total"));

  let comparison: { year: number; totalXof: number; totalEur: number; variationXof: number | null; variationEur: number | null } | null = null;
  if (compareYear !== undefined) {
    const previous = buildFinancialReport(entries, compareYear, undefined, euroToXofRate).total;
    comparison = {
      year: compareYear,
      totalXof: previous.balanceXof,
      totalEur: previous.balanceEur,
      variationXof: previous.balanceXof === 0 ? null : Math.round(((total.balanceXof - previous.balanceXof) / Math.abs(previous.balanceXof)) * 10000) / 100,
      variationEur: previous.balanceEur === 0 ? null : Math.round(((total.balanceEur - previous.balanceEur) / Math.abs(previous.balanceEur)) * 10000) / 100,
    };
  }
  return { year, monthly, total, breakdown, comparison };
}
