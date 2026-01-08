import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeClient = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2024-04-10" })
  : null;

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "payout.paid":
    case "payout.created":
    case "payout.failed":
    case "payout.canceled":
      await handlePayoutEvent(event.data.object as Stripe.Payout, event.type);
      break;
    case "charge.refunded":
      await handleRefundEvent(event.data.object as Stripe.Charge);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
    default:
      break;
  }
}

async function handlePayoutEvent(payout: Stripe.Payout, eventType: string) {
  const userId = (payout.metadata?.userId as string) || null;
  const amount = payout.amount || 0;
  const status = payout.status || eventType.replace("payout.", "");

  const record = await prisma.payout.upsert({
    where: { referenceId: payout.id },
    update: {
      amount,
      currency: payout.currency,
      status,
      updatedAt: new Date()
    },
    create: {
      creatorId: userId || "unknown",
      dealId: "unknown",
      referenceId: payout.id,
      amount,
      currency: payout.currency,
      status
    }
  });

  if (userId) {
    await prisma.creatorBalance.upsert({
      where: { userId },
      update: {
        ...adjustBalance(amount, status),
        currency: payout.currency
      },
      create: {
        userId,
        available: status === "paid" ? 0 : 0,
        pending: status === "paid" ? 0 : amount,
        currency: payout.currency,
        metadata: toJson(payout.metadata || {})
      }
    });
  }

  return record;
}

function adjustBalance(amount: number, status: string) {
  if (status === "paid") {
    return { available: { decrement: amount }, pending: { decrement: Math.max(amount, 0) } };
  }
  if (status === "failed" || status === "canceled") {
    return { available: { increment: amount }, pending: { decrement: Math.max(amount, 0) } };
  }
  return { pending: { increment: amount } };
}

async function handleRefundEvent(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntentId },
    data: {
      status: "refunded",
      metadata: toJson({ ...(charge.metadata || {}), refundId: charge.id })
    }
  });
}

async function handlePaymentFailed(payment: Stripe.PaymentIntent) {
  await prisma.payment.upsert({
    where: { stripePaymentIntentId: payment.id },
    create: {
      stripePaymentIntentId: payment.id,
      amount: payment.amount ?? 0,
      currency: payment.currency ?? "usd",
      status: payment.status ?? "payment_failed",
      metadata: toJson(payment.metadata || {})
    },
    update: {
      status: payment.status ?? "payment_failed",
      metadata: toJson(payment.metadata || {})
    }
  });
}

async function handleAccountUpdated(account: Stripe.Account) {
  const userId = (account.metadata?.userId as string) || null;
  if (!userId) return;
  const metadata = account ? toJson(account) : null;
  await prisma.creatorBalance.upsert({
    where: { userId },
    update: { metadata },
    create: {
      userId,
      currency: "usd",
      available: 0,
      pending: 0,
      metadata
    }
  }).catch((error) => logError("account update balance failed", error));
}

function toJson(value: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  } catch {
    return (value ?? null) as Prisma.InputJsonValue;
  }
}

