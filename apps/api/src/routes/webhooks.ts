import type { Request, Response } from "express";
import { stripeClient, stripeWebhookSecret, handleStripeEvent } from "../services/stripeService.js";
import prisma from "../lib/prisma.js";
import { logError } from "../lib/logger.js";

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripeClient || !stripeWebhookSecret) {
    return res.status(503).json({ error: "Stripe not configured" });
  }
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    return res.status(400).json({ error: "Missing stripe signature" });
  }

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
  } catch (err) {
    logError("Stripe signature verification failed", err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  const log = await prisma.webhookLog.create({
    data: {
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      status: "received",
      payload: event
    }
  });

  try {
    await handleStripeEvent(event);
    await prisma.webhookLog.update({
      where: { id: log.id },
      data: { status: "processed" }
    });
    res.json({ received: true });
  } catch (error) {
    logError("Failed to process stripe event", error, { eventId: event.id });
    await prisma.webhookLog.update({
      where: { id: log.id },
      data: { status: "failed", error: error instanceof Error ? error.message : "Unknown" }
    });
    res.status(500).json({ error: "Failed to process event" });
  }
}
