import { Prisma } from "@prisma/client";
import express, { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import crypto from "node:crypto";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { stripeClient, handleStripeEvent } from "../services/stripeService.js";
import { sendTemplatedEmail } from "../services/email/emailClient.js";
import { logError } from "../lib/logger.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

const stripePaymentsSecret =
  process.env.STRIPE_PAYMENTS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
const paypalWebhookSecret = process.env.PAYPAL_WEBHOOK_SECRET || "";
const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID || "";

const intentSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const invoiceSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().int().positive(),
  description: z.string().min(1)
});

router.post("/intent", requireAuth, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: true, message: "Stripe not configured" });
  }
  try {
    const payload = intentSchema.parse(req.body ?? {});
    const intent = await stripeClient.paymentIntents.create({
      amount: payload.amount,
      currency: payload.currency,
      metadata: payload.metadata as any
    });
    return res.json({ clientSecret: intent.client_secret });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payment intent";
    return res.status(400).json({ error: true, message });
  }
});

router.post("/invoice", requireAuth, async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: true, message: "Stripe not configured" });
  }
  try {
    const payload = invoiceSchema.parse(req.body ?? {});
    const item = await stripeClient.invoiceItems.create({
      customer: payload.customerId,
      amount: payload.amount,
      currency: "usd",
      description: payload.description
    });
    const invoice = await stripeClient.invoices.create({
      customer: payload.customerId,
      auto_advance: true,
      collection_method: "send_invoice",
      days_until_due: 30,
      metadata: { invoiceItemId: item.id }
    });
    return res.json({ invoiceId: invoice.id, hostedInvoiceUrl: invoice.hosted_invoice_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create invoice";
    return res.status(400).json({ error: true, message });
  }
});

const payoutSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().default("usd"),
  destination: z.string().min(1), // Stripe account ID or bank account ID
  metadata: z.record(z.string(), z.unknown()).optional(),
  description: z.string().optional()
});

// POST /api/payments/payout - Create a Stripe payout (admin only)
router.post("/payout", requireAuth, requireRole(['ADMIN', 'SUPERADMIN', 'AGENCY_ADMIN']), async (req: Request, res: Response) => {
  if (!stripeClient) {
    return res.status(503).json({ error: true, message: "Stripe not configured" });
  }
  try {
    const payload = payoutSchema.parse(req.body ?? {});
    
    // Create payout in Stripe
    const payout = await stripeClient.payouts.create({
      amount: payload.amount,
      currency: payload.currency,
      destination: payload.destination,
      metadata: {
        ...payload.metadata,
        userId: req.user?.id || "system",
        createdBy: req.user?.id || "system"
      },
      description: payload.description || `Payout for ${req.user?.id || "user"}`
    });

    // Create payout record in database
    const creatorId = (payload.metadata?.creatorId as string) || req.user?.id || "";
    const dealId = (payload.metadata?.dealId as string) || "";
    const payoutRecord = await prisma.payout.create({
      data: {
        id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: req.user?.id || null,
        referenceId: payout.id,
        creatorId,
        dealId,
        brandId: (payload.metadata?.brandId as string) || null,
        amount: payout.amount / 100, // Stripe amounts are in cents
        currency: payout.currency as string,
        status: payout.status === "paid" ? "paid" : "pending",
        paidAt: payout.arrival_date ? new Date(payout.arrival_date * 1000) : null,
        createdBy: req.user?.id || null,
        updatedAt: new Date()
      }
    });

    return res.json({ 
      payout: payoutRecord,
      stripePayoutId: payout.id,
      status: payout.status
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payout";
    logError("Failed to create Stripe payout", error);
    return res.status(400).json({ error: true, message });
  }
});

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!stripeClient || !stripePaymentsSecret) {
      return res.status(503).json({ error: "Stripe payments not configured" });
    }
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      return res.status(400).json({ error: "Missing stripe signature" });
    }

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, signature, stripePaymentsSecret);
    } catch (error) {
      logError("Stripe payments signature verification failed", error);
      return res.status(400).json({ error: "Invalid stripe signature" });
    }

    // Idempotency check: Check if this event was already processed
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        action: "PAYMENT_WEBHOOK_PROCESSED",
        metadata: {
          path: ["eventId"],
          equals: event.id
        }
      }
    });

    if (existingLog) {
      console.log(`[STRIPE WEBHOOK] Event ${event.id} already processed, skipping (idempotency)`);
      return res.json({ received: true, duplicate: true });
    }

    await recordPaymentLog("stripe", event.type, event.id, event);

    try {
      await handleStripeEvent(event);
      await processStripePaymentEvent(event);
      
      // Mark event as processed for idempotency
      await prisma.auditLog.create({
        data: {
          id: `payment_webhook_${event.id}_${Date.now()}`,
          action: "PAYMENT_WEBHOOK_PROCESSED",
          entityType: "Payment",
          metadata: {
            provider: "stripe",
            eventId: event.id,
            eventType: event.type,
            processedAt: new Date().toISOString()
          }
        }
      });
      
      return res.json({ received: true });
    } catch (error) {
      logError("Failed to process stripe payment event", error, { eventId: event.id });
      return res.status(500).json({ error: "Failed to process event" });
    }
  }
);

router.post(
  "/paypal/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    if (!paypalWebhookSecret) {
      return res.status(503).json({ error: "PayPal webhook not configured" });
    }
    if (!verifyPayPalSignature(req)) {
      return res.status(400).json({ error: "Invalid PayPal signature" });
    }

    let payload: PayPalWebhookEvent;
    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch (error) {
      logError("Failed to parse PayPal webhook payload", error);
      return res.status(400).json({ error: "Invalid payload" });
    }

    if (!payload.id) {
      return res.status(400).json({ error: "Missing PayPal event ID" });
    }

    // Idempotency check: Check if this event was already processed
    // Note: Cannot use nested JSON path queries - using simpler approach
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        action: "PAYMENT_WEBHOOK_PROCESSED",
        metadata: {
          equals: { provider: "paypal", eventId: payload.id }
        }
      }
    });

    if (existingLog) {
      console.log(`[PAYPAL WEBHOOK] Event ${payload.id} already processed, skipping (idempotency)`);
      return res.json({ received: true, duplicate: true });
    }

    await recordPaymentLog("paypal", payload.event_type || "unknown", payload.id, payload);

    try {
      await processPayPalEvent(payload);
      
      // Mark event as processed for idempotency
      await prisma.auditLog.create({
        data: {
          id: `payment_webhook_${payload.id}_${Date.now()}`,
          action: "PAYMENT_WEBHOOK_PROCESSED",
          entityType: "Payment",
          metadata: {
            provider: "paypal",
            eventId: payload.id,
            eventType: payload.event_type || "unknown",
            processedAt: new Date().toISOString()
          }
        }
      });
      
      return res.json({ received: true });
    } catch (error) {
      logError("Failed to process PayPal event", error, { eventId: payload.id });
      return res.status(500).json({ error: "Failed to process PayPal event" });
    }
  }
);

export default router;

async function processStripePaymentEvent(event: Stripe.Event) {
  switch (event.type) {
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
    case "invoice.finalized":
      await handleStripeInvoiceEvent(event);
      break;
    case "payout.paid":
    case "payout.failed":
    case "payout.canceled":
    case "payout.created":
      await handleStripePayoutEvent(event);
      break;
    default:
      break;
  }
}

async function handleStripeInvoiceEvent(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const externalId = (invoice.metadata?.invoiceId as string) || invoice.id;
  const brandEmail = (invoice.metadata?.brandEmail as string) || invoice.customer_email || null;
  const brandName = (invoice.metadata?.brandName as string) || invoice.customer_name || null;
  const userId =
    typeof invoice.metadata?.brandUserId === "string" ? invoice.metadata?.brandUserId : null;
  const dealId = (invoice.metadata?.dealId as string) || "";
  const amount = invoice.amount_paid ?? invoice.amount_due ?? 0;
  const currency = invoice.currency ?? "usd";
  const status = resolveStripeInvoiceStatus(event.type, invoice);

  const record = await prisma.invoice.upsert({
    where: { externalId: externalId || "none" },
    update: {
      userId: userId || undefined,
      amount,
      currency,
      status,
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: `inv_${Date.now()}`,
      dealId,
      externalId,
      userId,
      amount,
      currency,
      status,
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      invoiceNumber: `INV-${Date.now()}`,
    }
  });

  await prisma.reconciliation.upsert({
    where: { invoiceId: record.id },
    update: {
      status: status === "paid" ? "invoice_paid" : status
    },
    create: {
      invoiceId: record.id,
      type: "stripe_invoice",
      referenceId: record.externalId || record.id,
      amount: amount || 0,
      status: status === "paid" ? "invoice_paid" : status
    }
  });

  if (status === "paid") {
    await notifyBrandInvoice(record);
  }
}

async function handleStripePayoutEvent(event: Stripe.Event) {
  const payout = event.data.object as Stripe.Payout;
  const invoiceRef = (payout.metadata?.invoiceId as string) || null;
  const status = resolveStripePayoutStatus(event.type, payout.status);

  await prisma.payout.updateMany({
    where: { referenceId: payout.id },
    data: {
      status
    }
  });

  const payoutRecord = await prisma.payout.findUnique({ where: { referenceId: payout.id } });
  if (!payoutRecord) return;

  if (invoiceRef) {
    const invoiceRecord = await prisma.invoice.findUnique({ where: { externalId: invoiceRef } });
    if (invoiceRecord) {
      await prisma.reconciliation.upsert({
        where: { invoiceId: invoiceRecord.id },
        update: {
          referenceId: payoutRecord.referenceId,
          status: status === "paid" ? "payout_paid" : status
        },
        create: {
          type: "stripe_payout",
          referenceId: payoutRecord.referenceId,
          invoiceId: invoiceRecord.id,
          amount: payoutRecord.amount,
          status: status === "paid" ? "payout_paid" : status
        }
      });
    }
  }

  if (status === "paid") {
    await notifyTalentPayout(payoutRecord, payout.metadata);
  }
}

async function processPayPalEvent(event: PayPalWebhookEvent) {
  switch (event.event_type) {
    case "PAYMENT.SALE.COMPLETED":
    case "PAYMENT.SALE.DENIED":
      await handlePayPalInvoiceEvent(event);
      break;
    case "PAYMENT.PAYOUTS-ITEM.SUCCEEDED":
    case "PAYMENT.PAYOUTS-ITEM.FAILED":
    case "PAYMENT.PAYOUTS-ITEM.CANCELED":
      await handlePayPalPayoutEvent(event);
      break;
    default:
      break;
  }
}

async function handlePayPalInvoiceEvent(event: PayPalWebhookEvent) {
  const resource = event.resource ?? {};
  const rawId =
    resource.invoice_id ||
    resource.invoice ||
    resource.id ||
    resource.custom ||
    resource.billing_agreement_id;
  const externalId = rawId ? `paypal:${rawId}` : `paypal:${event.id}`;
  const brandEmail =
    resource.payer?.email_address ||
    resource.payer?.payer_info?.email ||
    resource.billing_info?.email ||
    resource.custom_fields?.brandEmail ||
    null;
  const brandName =
    resource.payer?.name?.given_name ||
    resource.payer?.payer_info?.first_name ||
    resource.custom_fields?.brandName ||
    null;
  const userId =
    typeof resource.custom_fields?.brandUserId === "string"
      ? resource.custom_fields?.brandUserId
      : null;
  const dealId = (resource.custom_fields?.dealId as string) || "";
  const { amount, currency } = extractPayPalAmount(resource);
  const status =
    event.event_type === "PAYMENT.SALE.COMPLETED"
      ? "paid"
      : event.event_type === "PAYMENT.SALE.DENIED"
      ? "failed"
      : resource.status?.toLowerCase() || "pending";

  const record = await prisma.invoice.upsert({
    where: { externalId: externalId || "none" },
    update: {
      userId: userId || undefined,
      amount,
      currency,
      status,
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: `inv_${Date.now()}`,
      dealId,
      externalId,
      userId,
      amount,
      currency,
      status,
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      invoiceNumber: `INV-${Date.now()}`,
    }
  });

  await prisma.reconciliation.upsert({
    where: { invoiceId: record.id },
    update: {
      status: status === "paid" ? "invoice_paid" : status,
    },
    create: {
      invoiceId: record.id,
      type: "paypal",
      referenceId: record.externalId || record.id,
      amount: amount || 0,
      status: status === "paid" ? "invoice_paid" : status,
    }
  });

  if (status === "paid") {
    await notifyBrandInvoice(record);
  }
}

async function handlePayPalPayoutEvent(event: PayPalWebhookEvent) {
  const resource = event.resource ?? {};
  const payoutItem = resource.payout_item ?? {};
  const rawId =
    resource.payout_item_id ||
    payoutItem.payout_item_id ||
    resource.transaction_id ||
    payoutItem.sender_item_id ||
    event.id;
  const referenceId = `paypal:${rawId}`;
  const resourceAmount = extractPayPalAmount(resource);
  const payoutItemAmount = extractPayPalAmount(payoutItem);
  const amount = resourceAmount.amount || payoutItemAmount.amount;
  const currency = resourceAmount.currency || payoutItemAmount.currency;
  const status = normalizePayPalPayoutStatus(resource.transaction_status || event.event_type);
  const userId =
    typeof payoutItem.sender_item_id === "string" ? payoutItem.sender_item_id : undefined;
  const metadata = {
    ...resource,
    payoutItem
  };

  const payoutRecord = await prisma.payout.upsert({
    where: { referenceId },
    update: {
      amount,
      currency,
      status,
      updatedAt: new Date()
    },
    create: {
      id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      referenceId,
      creatorId: userId || "unknown",
      dealId: "unknown",
      amount,
      currency,
      status,
      updatedAt: new Date()
    }
  });

  const invoiceRef = payoutItem.metadata?.invoiceId || payoutItem.metadata?.invoice;
  if (invoiceRef && typeof invoiceRef === "string") {
    let invoice = await prisma.invoice.findUnique({ where: { externalId: invoiceRef } });
    if (!invoice && !invoiceRef.startsWith("paypal:")) {
      invoice = await prisma.invoice.findUnique({ where: { externalId: `paypal:${invoiceRef}` } });
    }
    if (invoice) {
      await prisma.reconciliation.upsert({
        where: { invoiceId: invoice.id },
        update: {
          referenceId: payoutRecord.referenceId,
          status: status === "paid" ? "payout_paid" : status
        },
        create: {
          type: "paypal_payout",
          referenceId: payoutRecord.referenceId,
          invoiceId: invoice.id,
          amount: payoutRecord.amount,
          status: status === "paid" ? "payout_paid" : status
        }
      });
    }
  }

  if (status === "paid") {
    await notifyTalentPayout(payoutRecord, payoutItem.metadata);
  }
}

async function recordPaymentLog(
  provider: string,
  eventType: string,
  referenceId: string,
  metadata: unknown
) {
  try {
    // PaymentLog model doesn't exist - skip logging
    console.log(`[Payment Log] ${provider} ${eventType}: ${referenceId}`);
  } catch (error) {
    logError("Failed to record payment log", error);
  }
}

function resolveStripeInvoiceStatus(eventType: string, invoice: Stripe.Invoice) {
  if (eventType === "invoice.payment_succeeded" || invoice.paid) return "paid";
  if (eventType === "invoice.payment_failed") return "failed";
  if (eventType === "invoice.finalized") return "finalized";
  return invoice.status ?? "pending";
}

function resolveStripePayoutStatus(eventType: string, payoutStatus?: string | null) {
  if (eventType === "payout.paid") return "paid";
  if (eventType === "payout.failed") return "failed";
  if (eventType === "payout.canceled") return "canceled";
  return payoutStatus ?? "pending";
}

function normalizePayPalPayoutStatus(status: string) {
  const normalized = status?.toLowerCase();
  if (normalized?.includes("success")) return "paid";
  if (normalized?.includes("fail")) return "failed";
  if (normalized?.includes("cancel")) return "canceled";
  return normalized || "pending";
}

async function notifyTalentPayout(
  payout: { referenceId: string; amount: number; currency: string; userId: string | null },
  metadata: Record<string, unknown> | null | undefined
) {
  let email: string | null = null;
  if (payout.userId) {
    const user = await prisma.user.findUnique({ where: { id: payout.userId } });
    email = user?.email ?? null;
  }
  if (!email) {
    const fallback = (metadata?.talentEmail || metadata?.email) as string | undefined;
    email = fallback || null;
  }
  if (!email) return;
  try {
    await sendTemplatedEmail({
      to: email,
      template: "payout-sent",
      data: {
        amount: formatCurrency(payout.amount, payout.currency),
        reference: payout.referenceId
      }
    });
  } catch (error) {
    logError("Failed to send payout notification", error, { payoutId: payout.referenceId });
  }
}

async function notifyBrandInvoice(invoice: {
  brandEmail?: string | null;
  externalId: string;
  amount: number;
  currency: string;
  provider: string;
}) {
  if (!invoice.brandEmail) return;
  try {
    await sendTemplatedEmail({
      to: invoice.brandEmail,
      template: "systemAlert",
      data: {
        subject: "Invoice processed",
        headline: `Invoice ${invoice.externalId} processed`,
        detail: `We received ${formatCurrency(invoice.amount, invoice.currency)} via ${invoice.provider}.`
      }
    });
  } catch (error) {
    logError("Failed to notify brand invoice", error, { invoiceId: invoice.externalId });
  }
}

function extractPayPalAmount(resource: Record<string, any>) {
  const amountValue =
    resource.amount?.total ??
    resource.amount?.value ??
    resource.gross_amount?.value ??
    resource.transaction_amount?.value ??
    0;
  const currency =
    resource.amount?.currency ??
    resource.amount?.currency_code ??
    resource.gross_amount?.currency_code ??
    resource.transaction_amount?.currency_code ??
    "usd";
  const parsed = typeof amountValue === "number" ? amountValue : parseFloat(amountValue || "0");
  const cents = Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  return { amount: cents, currency: (currency || "usd").toLowerCase() };
}

function verifyPayPalSignature(req: Request) {
  if (!paypalWebhookSecret) return false;
  const transmittedSignature = req.header("paypal-transmission-sig");
  if (!transmittedSignature) return false;
  const timestamp = req.header("paypal-transmission-time") || "";
  const expected = crypto
    .createHmac("sha256", paypalWebhookSecret)
    .update(`${paypalWebhookId}:${timestamp}:${req.body}`)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(transmittedSignature, "base64"),
      Buffer.from(expected, "base64")
    );
  } catch {
    return false;
  }
}

function serializeJson(value: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  } catch {
    return (value ?? null) as Prisma.InputJsonValue;
  }
}

function formatCurrency(amount: number, currency = "usd") {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

type PayPalWebhookEvent = {
  id: string;
  event_type: string;
  resource?: any;
};
