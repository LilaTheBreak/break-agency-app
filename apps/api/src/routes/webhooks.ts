import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { stripeClient, stripeWebhookSecret, handleStripeEvent } from '../services/stripeService.js';
import prisma from '../lib/prisma.js';
import { logError } from '../lib/logger.js';

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

  // const log = await prisma.webhookLog.create({
  //   data: {
  //     provider: "stripe",
  //     eventId: event.id,
  //     eventType: event.type,
  //     status: "received",
  //     payload: toJson(event)
  //   }
  // });

  try {
    await handleStripeEvent(event);
    // await prisma.webhookLog.update({
    //   where: { id: log.id },
    //   data: { status: "processed" }
    // });
    res.json({ received: true });
  } catch (error) {
    logError("Failed to process stripe event", error, { eventId: event.id });
    // await prisma.webhookLog.update({
    //   where: { id: log.id },
    //   data: { status: "failed", error: error instanceof Error ? error.message : "Unknown" }
    // });
    res.status(500).json({ error: "Failed to process event" });
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  } catch {
    return (value ?? null) as Prisma.InputJsonValue;
  }
}

/**
 * Instagram Webhook Verification
 * Handles the GET request from Instagram to verify the webhook endpoint
 */
export const instagramWebhookVerification = (req: Request, res: Response) => {
  console.log("🔔 WEBHOOK HIT");
  console.log("QUERY:", req.query);
  console.log("ENV TOKEN:", process.env.INSTAGRAM_VERIFY_TOKEN);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    console.log("✅ TOKEN MATCH — SENDING CHALLENGE");
    return res.status(200).send(challenge);
  }

  console.log("❌ TOKEN MISMATCH");
  return res.sendStatus(403);
};

/**
 * Instagram Webhook Event Receiver
 * Handles POST requests from Instagram with incoming events
 */
export async function instagramWebhookEventHandler(req: Request, res: Response) {
  try {
    const body = req.body;

    console.log("[INSTAGRAM WEBHOOK] Event received:", JSON.stringify(body, null, 2));

    // Acknowledge receipt immediately (Instagram expects 200 within 20 seconds)
    res.status(200).json({ status: "received" });

    // Process the event asynchronously
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.messaging && Array.isArray(entry.messaging)) {
          for (const message of entry.messaging) {
            await processInstagramEvent(message);
          }
        }
      }
    }
  } catch (error) {
    logError("Failed to process Instagram webhook event", error);
    // Still return 200 to acknowledge receipt to Instagram
    res.status(200).json({ status: "processed_with_error" });
  }
}

/**
 * Process individual Instagram events
 */
async function processInstagramEvent(event: any) {
  try {
    const senderId = event.sender?.id;
    const recipientId = event.recipient?.id;

    console.log("[INSTAGRAM EVENT] Processing:", {
      senderId,
      recipientId,
      hasMessage: !!event.message,
      hasPostback: !!event.postback,
      hasDelivery: !!event.delivery,
      hasRead: !!event.read
    });

    // Handle different event types
    if (event.message) {
      console.log("[INSTAGRAM EVENT] Message:", event.message);
      // TODO: Implement message handling
      // Store message in database, trigger notifications, etc.
    }

    if (event.postback) {
      console.log("[INSTAGRAM EVENT] Postback:", event.postback);
      // TODO: Implement postback handling
    }

    if (event.delivery) {
      console.log("[INSTAGRAM EVENT] Delivery receipt");
      // TODO: Update message status to delivered
    }

    if (event.read) {
      console.log("[INSTAGRAM EVENT] Read receipt");
      // TODO: Update message status to read
    }
  } catch (error) {
    logError("Failed to process individual Instagram event", error, { event });
  }
}
