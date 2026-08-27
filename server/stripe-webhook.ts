import type { Request, Response } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { campaigns, cotisations, dons, members, stripeEvents, stripePayments, transactions } from "../drizzle/schema";
import { sendTransactionalEmail } from "./brevo";
import { logAudit } from "./audit";
import { createUserNotification } from "./notification-center";

const paidAt = () => new Date().toISOString().slice(0, 19).replace("T", " ");

function amountInMajorUnits(amountMinor: number, currency: string) {
  return currency.toLowerCase() === "xof" ? String(amountMinor) : (amountMinor / 100).toFixed(2);
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];
  if (!secretKey || !webhookSecret || typeof signature !== "string") {
    return res.status(400).json({ error: "Configuration Stripe ou signature absente." });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(secretKey);
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe] Signature webhook invalide", error);
    return res.status(400).json({ error: "Signature Stripe invalide." });
  }

  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe] Événement de test détecté");
    return res.json({ verified: true });
  }

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Base de données indisponible." });

  try {
    await db.insert(stripeEvents).values({ stripeEventId: event.id, eventType: event.type, status: "received" });
  } catch {
    return res.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentRows = await db.select().from(stripePayments).where(eq(stripePayments.stripeCheckoutSessionId, session.id)).limit(1);
      const payment = paymentRows[0];
      if (payment && payment.status !== "completed") {
        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : undefined;
        await db.update(stripePayments).set({ status: "completed", stripePaymentIntentId: paymentIntentId, updatedAt: paidAt() }).where(eq(stripePayments.id, payment.id));
        await logAudit({ action: "UPDATE", entityType: "stripe_payment", entityId: payment.id, entityName: session.id, description: "Paiement Stripe confirmé par webhook", newValue: JSON.stringify({ status: "completed", eventId: event.id }), status: "success" });
        const amount = session.amount_total ?? 0;
        const currency = (session.currency ?? "eur").toUpperCase();
        const metadata = session.metadata ?? {};
        if (payment.paymentType === "cotisation" && payment.cotisationId) {
          await db.update(cotisations).set({ statut: "payée", datePayment: paidAt() }).where(eq(cotisations.id, payment.cotisationId));
        }
        let donationId = payment.donationId ?? undefined;
        if ((payment.paymentType === "don" || payment.paymentType === "campagne") && !donationId) {
          const donationResult = await db.insert(dons).values({
            donateur: session.customer_details?.name || metadata.customer_name || "Donateur Stripe",
            montant: amountInMajorUnits(amount, currency),
            currency: currency === "XOF" ? "XOF" : "EUR",
            description: String(metadata.description || (payment.paymentType === "campagne" ? "Don affecté à une campagne" : "Don Stripe")),
            email: session.customer_details?.email || metadata.customer_email || undefined,
            date: paidAt(),
          });
          donationId = Number(donationResult[0].insertId);
          await db.update(stripePayments).set({ donationId, updatedAt: paidAt() }).where(eq(stripePayments.id, payment.id));
        }
        if (payment.paymentType === "campagne" && payment.campaignId) {
          const campaignRows = await db.select().from(campaigns).where(eq(campaigns.id, payment.campaignId)).limit(1);
          const campaign = campaignRows[0];
          if (campaign) {
            const total = Number.parseFloat(campaign.montantCollecte || "0") + Number(amountInMajorUnits(amount, currency));
            await db.update(campaigns).set({ montantCollecte: total.toFixed(2), updatedAt: paidAt() }).where(eq(campaigns.id, campaign.id));
          }
        }
        await db.insert(transactions).values({
          type: payment.paymentType === "cotisation" ? "cotisation" : "don",
          montant: amountInMajorUnits(amount, currency),
          currency: currency === "XOF" ? "XOF" : "EUR",
          description: String(metadata.description || `Paiement Stripe ${payment.paymentType}`),
          memberId: payment.memberId ?? undefined,
          referenceId: payment.cotisationId ?? donationId ?? payment.campaignId ?? undefined,
        });

        const memberRows = payment.memberId
          ? await db.select({ userId: members.userId, firstName: members.firstName, lastName: members.lastName, email: members.email }).from(members).where(eq(members.id, payment.memberId)).limit(1)
          : [];
        const recipientEmail = session.customer_details?.email || metadata.customer_email || memberRows[0]?.email;
        if (memberRows[0]?.userId) {
          const paymentLabel = payment.paymentType === "cotisation" ? "cotisation" : payment.paymentType === "campagne" ? "don affecté à une campagne" : "don";
          await createUserNotification({
            userId: memberRows[0].userId,
            title: "Paiement confirmé",
            message: `Votre ${paymentLabel} de ${amountInMajorUnits(amount, currency)} ${currency} a bien été reçu.`,
            type: "success",
            actionUrl: "/finance",
            eventKey: "payment_received",
            entityType: "stripe_payment",
            entityId: payment.id,
            dedupeKey: `stripe-payment-received:${session.id}`,
          });
        }
        if (recipientEmail) {
          try {
            const paymentLabel = payment.paymentType === "cotisation" ? "cotisation" : payment.paymentType === "campagne" ? "don affecté à une campagne" : "don";
            const recipientName = session.customer_details?.name || `${memberRows[0]?.firstName ?? ""} ${memberRows[0]?.lastName ?? ""}`.trim() || undefined;
            const content = `Bonjour${recipientName ? ` ${recipientName}` : ""},\n\nNous confirmons la réception de votre ${paymentLabel} d’un montant de ${amountInMajorUnits(amount, currency)} ${currency}.\n\nRéférence Stripe : ${session.id}\n\nMerci pour votre soutien aux Bâtisseurs Engagés.`;
            const emailResult = await sendTransactionalEmail({ to: { email: recipientEmail, name: recipientName }, subject: "Confirmation de votre paiement — Les Bâtisseurs Engagés", textContent: content });
            await logAudit({ action: "CREATE", entityType: "transactional_email", entityId: payment.id, entityName: "stripe_payment_confirmation", description: `Confirmation de paiement envoyée par Brevo à ${recipientEmail}`, newValue: JSON.stringify({ provider: "brevo", messageId: emailResult.messageId, stripeSessionId: session.id }), status: "success" });
          } catch (emailError) {
            console.error("[Brevo] Confirmation de paiement non envoyée", emailError);
            await logAudit({ action: "CREATE", entityType: "transactional_email", entityId: payment.id, entityName: "stripe_payment_confirmation", description: `Échec de confirmation de paiement pour ${recipientEmail}`, status: "failed", errorMessage: emailError instanceof Error ? emailError.message : "Erreur inconnue" });
          }
        }
      }
    }

    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const object = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
      const sessionId = "id" in object && object.id.startsWith("cs_") ? object.id : undefined;
      if (sessionId) {
        await db.update(stripePayments).set({ status: "failed", updatedAt: paidAt() }).where(eq(stripePayments.stripeCheckoutSessionId, sessionId));
        const failedRows = await db.select({ id: stripePayments.id }).from(stripePayments).where(eq(stripePayments.stripeCheckoutSessionId, sessionId)).limit(1);
        if (failedRows[0]) await logAudit({ action: "UPDATE", entityType: "stripe_payment", entityId: failedRows[0].id, entityName: sessionId, description: "Paiement Stripe échoué ou session expirée", newValue: JSON.stringify({ status: "failed", eventId: event.id }), status: "success" });
      }
    }

    await db.update(stripeEvents).set({ status: "processed", processedAt: paidAt() }).where(eq(stripeEvents.stripeEventId, event.id));
    await logAudit({ action: "UPDATE", entityType: "stripe_event", entityId: 0, entityName: event.id, description: `Événement Stripe traité : ${event.type}`, newValue: JSON.stringify({ status: "processed" }), status: "success" });
    console.log(`[Stripe] Événement traité ${event.type} (${event.id})`);
    return res.json({ received: true });
  } catch (error) {
    await db.update(stripeEvents).set({ status: "failed" }).where(eq(stripeEvents.stripeEventId, event.id));
    console.error("[Stripe] Traitement webhook échoué", error);
    return res.status(500).json({ error: "Traitement webhook échoué." });
  }
}
