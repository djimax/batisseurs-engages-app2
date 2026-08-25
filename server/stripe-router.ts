import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { assertPermission } from "./authorization";
import { getDb } from "./db";
import { campaigns, stripePayments } from "../drizzle/schema";

const paymentTypeSchema = z.enum(["cotisation", "don", "campagne"]);
const currencySchema = z.enum(["EUR", "XOF"]);

let stripeClient: Stripe | null = null;

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Stripe n’est pas configuré. Ajoutez la clé secrète dans Paramètres > Paiement.",
    });
  }
  if (!stripeClient) stripeClient = new Stripe(secretKey);
  return stripeClient;
}

function getOrigin(origin: string | undefined) {
  return origin && /^https?:\/\/[^\s]+$/i.test(origin) ? origin : "http://localhost:3000";
}

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({
      paymentType: paymentTypeSchema,
      amountMinor: z.number().int().positive().max(100_000_000),
      currency: currencySchema,
      description: z.string().trim().min(2).max(250),
      memberId: z.number().int().positive().optional(),
      cotisationId: z.number().int().positive().optional(),
      donationId: z.number().int().positive().optional(),
      campaignId: z.number().int().positive().optional(),
      idempotencyKey: z.string().uuid().optional(),
    }).superRefine((input, ctx) => {
      if (input.paymentType === "cotisation" && !input.memberId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["memberId"], message: "Le membre est obligatoire pour une cotisation." });
      }
      if (input.paymentType === "campagne" && !input.campaignId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["campaignId"], message: "La campagne est obligatoire pour un don affecté." });
      }
      if (input.paymentType !== "cotisation" && input.cotisationId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cotisationId"], message: "Cet identifiant ne correspond pas au type de paiement." });
      }
      if (input.paymentType !== "don" && input.donationId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["donationId"], message: "Cet identifiant ne correspond pas au type de paiement." });
      }
      if (input.paymentType !== "campagne" && input.campaignId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["campaignId"], message: "Cet identifiant ne correspond pas au type de paiement." });
      }
    }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "finances.manage");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const stripe = getStripeClient();
      const origin = getOrigin(ctx.req.headers.origin);
      const metadata: Stripe.MetadataParam = {
        user_id: String(ctx.user.id),
        payment_type: input.paymentType,
        member_id: input.memberId ? String(input.memberId) : "",
        cotisation_id: input.cotisationId ? String(input.cotisationId) : "",
        donation_id: input.donationId ? String(input.donationId) : "",
        campaign_id: input.campaignId ? String(input.campaignId) : "",
      };
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: String(ctx.user.id),
        customer_email: ctx.user.email ?? undefined,
        allow_promotion_codes: true,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountMinor,
            product_data: { name: input.description },
          },
        }],
        metadata,
        success_url: `${origin}/finance?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/finance?stripe=cancelled`,
      }, input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined);
      if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe n’a pas retourné d’URL de paiement." });
      await db.insert(stripePayments).values({
        paymentType: input.paymentType,
        memberId: input.memberId,
        cotisationId: input.cotisationId,
        donationId: input.donationId,
        campaignId: input.campaignId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined,
        status: "created",
      });
      return { sessionId: session.id, checkoutUrl: session.url };
    }),

  campaignOptions: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "finances.view");
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: campaigns.id, title: campaigns.title, status: campaigns.status }).from(campaigns).orderBy(desc(campaigns.createdAt)).limit(100);
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "finances.view");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(stripePayments).orderBy(desc(stripePayments.createdAt)).limit(100);
  }),

  getBySessionId: protectedProcedure
    .input(z.object({ sessionId: z.string().regex(/^cs_[A-Za-z0-9_]+$/) }))
    .query(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "finances.view");
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(stripePayments).where(eq(stripePayments.stripeCheckoutSessionId, input.sessionId)).limit(1);
      return rows[0] ?? null;
    }),
});
