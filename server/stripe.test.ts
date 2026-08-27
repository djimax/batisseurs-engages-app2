import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { stripeWebhookHandler } from "./stripe-webhook";

const routerSource = readFileSync(new URL("./stripe-router.ts", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("./_core/index.ts", import.meta.url), "utf8");

describe("Stripe integration contract", () => {
  it("exposes the three supported payment types and minimal Checkout metadata", () => {
    expect(routerSource).toContain('z.enum(["cotisation", "don", "campagne"])');
    expect(routerSource).toContain("client_reference_id: String(ctx.user.id)");
    expect(routerSource).toContain('user_id: String(ctx.user.id)');
    expect(routerSource).toContain('payment_type: input.paymentType');
    expect(routerSource).toContain('allow_promotion_codes: true');
    expect(routerSource).toContain('mode: "payment"');
    expect(routerSource).toContain('idempotencyKey: input.idempotencyKey');
  });

  it("reconciles confirmed donations and campaign contributions locally", () => {
    const webhookSource = readFileSync(new URL("./stripe-webhook.ts", import.meta.url), "utf8");
    expect(webhookSource).toContain('createUserNotification({');
    expect(webhookSource).toContain('userId: memberRows[0].userId');
    expect(webhookSource).toContain('eventKey: "payment_received"');
    expect(webhookSource).toContain('dedupeKey: `stripe-payment-received:${session.id}`');
    expect(webhookSource).toContain('db.insert(dons).values');
    expect(webhookSource).toContain('payment.paymentType === "campagne"');
    expect(webhookSource).toContain('await db.insert(transactions).values');
    expect(webhookSource).toContain('sendTransactionalEmail');
    expect(webhookSource).toContain('Confirmation de votre paiement');
    expect(webhookSource).toContain('Confirmation de paiement non envoyée');
  });

  it("notifies the campaign creator exactly when the 80 percent threshold is crossed", () => {
    const webhookSource = readFileSync(new URL("./stripe-webhook.ts", import.meta.url), "utf8");
    expect(webhookSource).toContain("previousProgress < 80 && currentProgress >= 80");
    expect(webhookSource).toContain('eventKey: "campaign_progress_threshold"');
    expect(webhookSource).toContain('dedupeKey: `campaign-progress:${campaign.id}:80`');
    expect(webhookSource).toContain('userId: campaign.createdBy');
  });

  it("mounts the webhook with a raw body parser before JSON", () => {
    expect(indexSource).toContain('app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);');
    expect(indexSource.indexOf("stripeWebhookHandler")).toBeLessThan(indexSource.indexOf("express.json"));
  });

  it("returns the required verification response for Stripe test events", async () => {
    const payload = JSON.stringify({ id: "evt_test_contract", object: "event", api_version: "2025-01-27.acacia", created: 1_700_000_000, data: { object: {} }, livemode: false, pending_webhooks: 1, request: null, type: "customer.created" });
    const secret = "whsec_contract_test";
    process.env.STRIPE_SECRET_KEY = "sk_test_contract";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    const stripe = new Stripe("sk_test_contract");
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    const response = {
      status: () => response,
      json: (body: unknown) => body,
    };
    const result = await stripeWebhookHandler({ headers: { "stripe-signature": signature }, body: Buffer.from(payload) } as never, response as never);
    expect(result).toEqual({ verified: true });
  });
});
