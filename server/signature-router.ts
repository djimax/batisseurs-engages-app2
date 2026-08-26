import { createHash } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "./_core/trpc";
import { assertPermission } from "./authorization";
import { logAudit } from "./audit";
import { sendTransactionalEmail } from "./brevo";
import { getOrCreateNotificationPreferences } from "./notification-center";
import { buildSignedDocumentPdf } from "./signed-pdf";
import { getDb, getDocumentById, getMemberById, getSignatureRequestById, getSignatureRequestsForDocument, createSignatureRequest, signSignatureRequest, cancelSignatureRequest, buildDocumentIntegrityHash, getSignatureExportData } from "./db";
import { members } from "../drizzle/schema";

async function sendFinalizedSignatureEmails(requestId: number, actorUserId: number): Promise<void> {
  const data = await getSignatureExportData(requestId);
  if (!data) return;
  const pdf = buildSignedDocumentPdf(data);
  if (pdf.byteLength > 9 * 1024 * 1024) throw new Error("Le PDF de preuve dépasse la taille maximale d’envoi");
  const attachment = [{ name: `document-signe-${requestId}.pdf`, content: pdf.toString("base64") }];
  for (const signer of data.request.signers) {
    const alreadySent = data.audit.some((entry) => entry.action === "EMAIL_SENT" && entry.description?.includes(signer.signerEmail));
    if (alreadySent) continue;
    const member = await getMemberById(signer.memberId);
    if (!signer.signerEmail || (member?.userId && (await getOrCreateNotificationPreferences(member.userId))?.emailEnabled === 0)) {
      await logAudit({ userId: actorUserId, action: "EMAIL_SKIPPED", entityType: "signature_request", entityId: requestId, entityName: data.request.subject, description: `PDF non envoyé à ${signer.signerEmail || "un signataire sans e-mail"}`, status: "success" });
      continue;
    }
    try {
      const result = await sendTransactionalEmail({
        to: { email: signer.signerEmail, name: signer.signerName },
        subject: `Document signé — ${data.request.subject}`,
        textContent: `Bonjour ${signer.signerName},\\n\\nLe document « ${data.document.title} » a été entièrement signé. La preuve PDF est jointe à cet e-mail.\\n\\nEmpreinte du document : ${data.request.documentHash}`,
        attachment,
      });
      await logAudit({ userId: actorUserId, action: "EMAIL_SENT", entityType: "signature_request", entityId: requestId, entityName: data.request.subject, description: `PDF signé envoyé à ${signer.signerEmail}`, newValue: JSON.stringify({ messageId: result.messageId, documentHash: data.request.documentHash }), status: "success" });
    } catch (error) {
      await logAudit({ userId: actorUserId, action: "EMAIL_FAILED", entityType: "signature_request", entityId: requestId, entityName: data.request.subject, description: `Échec d’envoi du PDF à ${signer.signerEmail}`, newValue: JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), status: "failed" });
    }
  }
}

const signatureInput = z.object({
  documentId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  subject: z.string().trim().min(1).max(255),
  expiresAt: z.string().datetime().optional(),
});

export const signatureRouter = router({
  listForDocument: protectedProcedure
    .input(z.object({ documentId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "signatures.view");
      return getSignatureRequestsForDocument(input.documentId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "signatures.view");
      return getSignatureRequestById(input.id);
    }),

  createRequest: protectedProcedure
    .input(signatureInput)
    .mutation(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "signatures.manage");
      const document = await getDocumentById(input.documentId);
      if (!document) throw new Error("Document introuvable");
      const member = await getMemberById(input.memberId);
      if (!member || member.status !== "active") throw new Error("Le signataire doit être un membre actif");
      const result = await createSignatureRequest({
        documentId: document.id,
        createdBy: ctx.user.id,
        subject: input.subject,
        documentHash: buildDocumentIntegrityHash(document),
        expiresAt: input.expiresAt ?? null,
        signer: { memberId: member.id, signerName: `${member.firstName} ${member.lastName}`.trim(), signerEmail: member.email ?? "" },
      });
      await logAudit({ userId: ctx.user.id, action: "CREATE", entityType: "signature_request", entityId: result?.id, entityName: input.subject, description: `Demande de signature créée pour le document ${document.id}`, newValue: JSON.stringify({ documentHash: result?.documentHash, signerId: member.id }), status: "success" });
      return result;
    }),

  sign: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive(), signerId: z.number().int().positive(), typedSignature: z.string().trim().min(2).max(255), consent: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      const request = await getSignatureRequestById(input.requestId);
      if (!request) throw new Error("Demande de signature introuvable");
      const signer = request.signers.find((item) => item.id === input.signerId);
      if (!signer) throw new Error("Signataire introuvable");
      if (signer.status === "signed") return request;
      if (request.status === "cancelled" || request.status === "completed") throw new Error("Cette demande n’est plus signable");
      if (request.expiresAt && new Date(request.expiresAt).getTime() < Date.now()) throw new Error("Cette demande de signature a expiré");

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const memberRows = await db.select({ userId: members.userId }).from(members).where(eq(members.id, signer.memberId)).limit(1);
      const isAssignedMember = memberRows[0]?.userId === ctx.user.id;
      if (!isAssignedMember) await assertPermission(ctx.user, "signatures.sign");

      const signedAt = new Date().toISOString();
      const evidenceHash = createHash("sha256").update(JSON.stringify({ requestId: request.id, signerId: signer.id, documentHash: request.documentHash, signerName: signer.signerName, typedSignature: input.typedSignature, consent: input.consent, signedAt })).digest("hex");
      const result = await signSignatureRequest({ requestId: request.id, signerId: signer.id, typedSignature: input.typedSignature, signedAt, evidenceHash });
      await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "signature_request", entityId: request.id, entityName: request.subject, description: `Signature électronique enregistrée pour ${signer.signerName}`, newValue: JSON.stringify({ signerId: signer.id, evidenceHash, signedAt, documentHash: request.documentHash }), status: "success" });
      if (result?.status === "completed") {
        try {
          await sendFinalizedSignatureEmails(request.id, ctx.user.id);
        } catch (error) {
          await logAudit({ userId: ctx.user.id, action: "EMAIL_FAILED", entityType: "signature_request", entityId: request.id, entityName: request.subject, description: "Échec global de génération ou d’envoi du PDF signé", newValue: JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), status: "failed" });
        }
      }
      return result;
    }),

  retryProofEmail: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive(), signerId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "signatures.manage");
      const data = await getSignatureExportData(input.requestId);
      if (!data) throw new Error("La demande doit être entièrement signée");
      const signer = data.request.signers.find((item) => item.id === input.signerId);
      if (!signer) throw new Error("Signataire introuvable");
      const alreadySent = data.audit.some((entry) => entry.action === "EMAIL_SENT" && entry.description?.includes(signer.signerEmail));
      if (alreadySent) throw new Error("Le PDF a déjà été envoyé à ce signataire");
      if (!signer.signerEmail) throw new Error("Le signataire ne possède pas d’adresse e-mail");
      const member = await getMemberById(signer.memberId);
      if (member?.userId && (await getOrCreateNotificationPreferences(member.userId))?.emailEnabled === 0) throw new Error("Le signataire a désactivé les e-mails");
      try {
        const pdf = buildSignedDocumentPdf(data);
        const result = await sendTransactionalEmail({ to: { email: signer.signerEmail, name: signer.signerName }, subject: `Document signé — ${data.request.subject}`, textContent: `Bonjour ${signer.signerName},\\n\\nLa preuve PDF du document « ${data.document.title} » est jointe à cet e-mail.\\n\\nEmpreinte du document : ${data.request.documentHash}`, attachment: [{ name: `document-signe-${input.requestId}.pdf`, content: pdf.toString("base64") }] });
        await logAudit({ userId: ctx.user.id, action: "EMAIL_SENT", entityType: "signature_request", entityId: input.requestId, entityName: data.request.subject, description: `PDF signé envoyé à ${signer.signerEmail} (relance)`, newValue: JSON.stringify({ messageId: result.messageId, documentHash: data.request.documentHash, retry: true }), status: "success" });
        return { success: true, messageId: result.messageId } as const;
      } catch (error) {
        await logAudit({ userId: ctx.user.id, action: "EMAIL_FAILED", entityType: "signature_request", entityId: input.requestId, entityName: data.request.subject, description: `Échec de relance du PDF à ${signer.signerEmail}`, newValue: JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue", retry: true }), status: "failed" });
        throw error;
      }
    }),

  exportData: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "signatures.view");
      const data = await getSignatureExportData(input.id);
      if (!data) throw new Error("Seules les demandes entièrement signées peuvent être exportées");
      await logAudit({ userId: ctx.user.id, action: "EXPORT", entityType: "signature_request", entityId: input.id, entityName: data.request.subject, description: "Export PDF de la preuve de signature", newValue: JSON.stringify({ documentHash: data.request.documentHash }), status: "success" });
      return data;
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      await assertPermission(ctx.user, "signatures.manage");
      const result = await cancelSignatureRequest(input.id);
      await logAudit({ userId: ctx.user.id, action: "UPDATE", entityType: "signature_request", entityId: input.id, description: "Demande de signature annulée", status: "success" });
      return result;
    }),
});
