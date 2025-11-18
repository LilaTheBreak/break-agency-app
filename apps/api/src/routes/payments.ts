import { Prisma } from "@prisma/client";
import express, { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import crypto from "node:crypto";
import prisma from "../lib/prisma.js";
import { stripeClient, handleStripeEvent } from "../services/stripeService.js";
import { sendTemplatedEmail } from "../services/email/emailClient.js";
import { logError } from "../lib/logger.js";

const router = Router();

const stripePaymentsSecret =
  process.env.STRIPE_PAYMENTS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
const paypalWebhookSecret = process.env.PAYPAL_WEBHOOK_SECRET || "";
const paypalWebhookId = process.env.PAYPAL_WEBHOOK_ID || "";

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

    await recordPaymentLog("stripe", event.type, event.id, event);

    try {
      await handleStripeEvent(event);
      await processStripePaymentEvent(event);
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

    await recordPaymentLog("paypal", payload.event_type || "unknown", payload.id, payload);

    try {
      await processPayPalEvent(payload);
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
  const amount = invoice.amount_paid ?? invoice.amount_due ?? 0;
  const currency = invoice.currency ?? "usd";
  const status = resolveStripeInvoiceStatus(event.type, invoice);

  const record = await prisma.invoice.upsert({
    where: { externalId },
    update: {
      provider: "stripe",
      userId,
      brandEmail,
      brandName,
      amount,
      currency,
      status,
      processedAt: status === "paid" ? new Date() : null,
      metadata: serializeJson(invoice)
    },
    create: {
      externalId,
      provider: "stripe",
      userId,
      brandEmail,
      brandName,
      amount,
      currency,
      status,
      processedAt: status === "paid" ? new Date() : null,
      metadata: serializeJson(invoice)
    }
  });

  await prisma.reconciliation.upsert({
    where: { invoiceId: record.id },
    update: {
      status: status === "paid" ? "invoice_paid" : status,
      details: serializeJson({ provider: "stripe", event: event.type, invoiceId: record.externalId })
    },
    create: {
      invoiceId: record.id,
      status: status === "paid" ? "invoice_paid" : status,
      details: serializeJson({ provider: "stripe", event: event.type, invoiceId: record.externalId })
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
      status,
      metadata: serializeJson(payout.metadata || {})
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
          payoutId: payoutRecord.id,
          status: status === "paid" ? "payout_paid" : status,
          details: serializeJson({
            provider: "stripe",
            event: event.type,
            invoiceId: invoiceRecord.externalId,
            payoutId: payoutRecord.referenceId
          })
        },
        create: {
          invoiceId: invoiceRecord.id,
          payoutId: payoutRecord.id,
          status: status === "paid" ? "payout_paid" : status,
          details: serializeJson({
            provider: "stripe",
            event: event.type,
            invoiceId: invoiceRecord.externalId,
            payoutId: payoutRecord.referenceId
          })
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
  const { amount, currency } = extractPayPalAmount(resource);
  const status =
    event.event_type === "PAYMENT.SALE.COMPLETED"
      ? "paid"
      : event.event_type === "PAYMENT.SALE.DENIED"
      ? "failed"
      : resource.status?.toLowerCase() || "pending";

  const record = await prisma.invoice.upsert({
    where: { externalId },
    update: {
      provider: "paypal",
      userId,
      brandEmail,
      brandName,
      amount,
      currency,
      status,
      processedAt: status === "paid" ? new Date() : null,
      metadata: serializeJson(resource)
    },
    create: {
      externalId,
      provider: "paypal",
      userId,
      brandEmail,
      brandName,
      amount,
      currency,
      status,
      processedAt: status === "paid" ? new Date() : null,
      metadata: serializeJson(resource)
    }
  });

  await prisma.reconciliation.upsert({
    where: { invoiceId: record.id },
    update: {
      status: status === "paid" ? "invoice_paid" : status,
      details: serializeJson({
        provider: "paypal",
        event: event.event_type,
        invoiceId: record.externalId
      })
    },
    create: {
      invoiceId: record.id,
      status: status === "paid" ? "invoice_paid" : status,
      details: serializeJson({
        provider: "paypal",
        event: event.event_type,
        invoiceId: record.externalId
      })
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
      provider: "paypal",
      userId,
      amount,
      currency,
      status,
      destination: payoutItem.receiver || payoutItem.receiver_email || null,
      metadata: serializeJson(metadata)
    },
    create: {
      referenceId,
      provider: "paypal",
      userId,
      amount,
      currency,
      status,
      destination: payoutItem.receiver || payoutItem.receiver_email || null,
      metadata: serializeJson(metadata)
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
          payoutId: payoutRecord.id,
          status: status === "paid" ? "payout_paid" : status,
          details: serializeJson({
            provider: "paypal",
            event: event.event_type,
            invoiceId: invoice.externalId,
            payoutId: payoutRecord.referenceId
          })
        },
        create: {
          invoiceId: invoice.id,
          payoutId: payoutRecord.id,
          status: status === "paid" ? "payout_paid" : status,
          details: serializeJson({
            provider: "paypal",
            event: event.event_type,
            invoiceId: invoice.externalId,
            payoutId: payoutRecord.referenceId
          })
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
    await prisma.paymentLog.create({
      data: {
        provider,
        eventType,
        referenceId,
        metadata: serializeJson(metadata)
      }
    });
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
