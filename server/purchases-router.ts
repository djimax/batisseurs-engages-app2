import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";
import { assertPermission } from "./authorization";
import { logAudit } from "./audit";
import { createPurchaseQuote, createPurchaseRequest, createSupplier, getPurchaseBudgetStatus, getPurchaseQuotes, getPurchaseRequestById, getPurchaseRequests, getSuppliers, selectPurchaseQuote, updatePurchaseRequest, updateSupplier } from "./db";

const amountSchema = z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Montant invalide").refine((value) => Number(value) > 0, "Le montant doit être positif");

export const purchasesRouter = router({
  suppliers: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "suppliers.view");
    return getSuppliers();
  }),
  createSupplier: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(255), email: z.string().email().optional(), phone: z.string().max(50).optional(), address: z.string().max(2000).optional(), taxId: z.string().max(100).optional(), notes: z.string().max(5000).optional() })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "suppliers.manage");
    const supplier = await createSupplier({ ...input, createdBy: ctx.user.id });
    await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "supplier", entityId: supplier?.id, entityName: supplier?.name, description: `Fournisseur créé : ${supplier?.name}`, status: "success" });
    return supplier;
  }),
  updateSupplier: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(255).optional(), email: z.string().email().nullable().optional(), phone: z.string().max(50).nullable().optional(), address: z.string().max(2000).nullable().optional(), taxId: z.string().max(100).nullable().optional(), status: z.enum(["active", "inactive"]).optional(), notes: z.string().max(5000).nullable().optional() })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "suppliers.manage");
    const { id, ...changes } = input;
    const supplier = await updateSupplier(id, changes);
    await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "supplier", entityId: id, description: `Fournisseur mis à jour : ${id}`, status: "success" });
    return supplier;
  }),
  requests: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "purchases.view");
    return getPurchaseRequests();
  }),
  budgetStatus: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), category: z.string().trim().min(2).max(100), requestedAmount: amountSchema })).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "purchases.view");
    return getPurchaseBudgetStatus(input.projectId, input.category, Number(input.requestedAmount));
  }),
  createRequest: protectedProcedure.input(z.object({ supplierId: z.number().int().positive().nullable().optional(), projectId: z.number().int().positive().nullable().optional(), description: z.string().trim().min(3).max(500), category: z.string().trim().min(2).max(100), amount: amountSchema, currency: z.enum(["EUR", "XOF"]), neededBy: z.string().datetime().nullable().optional(), justification: z.string().max(5000).nullable().optional(), status: z.enum(["draft", "submitted"]).default("draft") })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "purchases.manage");
    if (input.status === "submitted" && input.projectId) {
      const budget = await getPurchaseBudgetStatus(input.projectId, input.category, Number(input.amount));
      if (!budget.withinBudget) throw new TRPCError({ code: "CONFLICT", message: `Budget projet insuffisant : ${budget.remaining.toFixed(2)} disponible(s)` });
    }
    const request = await createPurchaseRequest({ ...input, requestedBy: ctx.user.id });
    await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "purchase_request", entityId: request?.id, description: `Demande d’achat créée : ${input.description}`, status: "success" });
    return request;
  }),
  updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "submitted", "approved", "rejected", "ordered", "received", "paid", "cancelled"]) })).mutation(async ({ input, ctx }) => {
    const approvalStatuses = ["approved", "rejected"];
    await assertPermission(ctx.user, approvalStatuses.includes(input.status) ? "purchases.approve" : "purchases.manage");
    const existingRequest = input.status === "approved" ? await getPurchaseRequestById(input.id) : undefined;
    if (input.status === "approved" && existingRequest?.projectId) {
      const budget = await getPurchaseBudgetStatus(existingRequest.projectId, existingRequest.category, 0);
      if (budget.remaining < 0) throw new TRPCError({ code: "CONFLICT", message: `Approbation refusée : budget projet dépassé de ${Math.abs(budget.remaining).toFixed(2)}` });
    }
    const changes = approvalStatuses.includes(input.status) ? { status: input.status, approvedBy: ctx.user.id, approvedAt: new Date().toISOString() } : { status: input.status };
    const request = await updatePurchaseRequest(input.id, changes);
    await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "purchase_request", entityId: input.id, description: `Demande d’achat ${input.id} : ${input.status}`, newValue: JSON.stringify({ status: input.status }), status: "success" });
    return request;
  }),
  quotes: protectedProcedure.input(z.object({ purchaseRequestId: z.number().int().positive().optional() }).optional()).query(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "purchases.view");
    return getPurchaseQuotes(input?.purchaseRequestId);
  }),
  createQuote: protectedProcedure.input(z.object({ purchaseRequestId: z.number().int().positive(), supplierId: z.number().int().positive(), quoteNumber: z.string().max(100).nullable().optional(), amount: amountSchema, currency: z.enum(["EUR", "XOF"]), documentUrl: z.string().url().nullable().optional(), validUntil: z.string().datetime().nullable().optional(), document: z.object({ fileName: z.string().trim().min(1).max(255).refine((name) => !name.includes("/") && !name.includes("\\") && !name.includes("\0"), "Nom de fichier invalide"), fileType: z.enum(["application/pdf", "image/jpeg", "image/png"]), fileSize: z.number().int().positive().max(10 * 1024 * 1024), fileBase64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/, "Contenu Base64 invalide").max(15 * 1024 * 1024) }).nullable().optional() })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "purchases.manage");
    let documentUrl = input.documentUrl ?? null;
    if (input.document) {
      const fileBuffer = Buffer.from(input.document.fileBase64, "base64");
      if (fileBuffer.length !== input.document.fileSize) throw new TRPCError({ code: "BAD_REQUEST", message: "La taille de la pièce jointe est incohérente" });
      const safeFileName = input.document.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const { url } = await storagePut(`purchase-quotes/${input.purchaseRequestId}/${nanoid()}-${safeFileName}`, fileBuffer, input.document.fileType);
      documentUrl = url;
    }
    const { document, ...quoteInput } = input;
    const quote = await createPurchaseQuote({ ...quoteInput, documentUrl, createdBy: ctx.user.id });
    await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "purchase_quote", entityId: quote?.id, description: `Devis ajouté à la demande ${input.purchaseRequestId}`, status: "success" });
    return quote;
  }),
  selectQuote: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    await assertPermission(ctx.user, "purchases.manage");
    const quote = await selectPurchaseQuote(input.id);
    if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Devis introuvable" });
    await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "purchase_quote", entityId: input.id, description: `Devis retenu pour la demande ${quote.purchaseRequestId}`, newValue: JSON.stringify({ status: "selected", purchaseRequestId: quote.purchaseRequestId }), status: "success" });
    return quote;
  }),
});
