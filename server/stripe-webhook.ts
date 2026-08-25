import type { Request, Response } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { campaigns, cotisations, dons, stripeEvents, stripePayments, transactions } from "../drizzle/schema";

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
      }
    }

    if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
      const object = event.data.object as Stripe.Checkout.Session | Stripe.PaymentIntent;
      const sessionId = "id" in object && object.id.startsWith("cs_") ? object.id : undefined;
      if (sessionId) await db.update(stripePayments).set({ status: "failed", updatedAt: paidAt() }).where(eq(stripePayments.stripeCheckoutSessionId, sessionId));
    }

    await db.update(stripeEvents).set({ status: "processed", processedAt: paidAt() }).where(eq(stripeEvents.stripeEventId, event.id));
    console.log(`[Stripe] Événement traité ${event.type} (${event.id})`);
    return res.json({ received: true });
  } catch (error) {
    await db.update(stripeEvents).set({ status: "failed" }).where(eq(stripeEvents.stripeEventId, event.id));
    console.error("[Stripe] Traitement webhook échoué", error);
    return res.status(500).json({ error: "Traitement webhook échoué." });
  }
}
