import prisma from "../lib/prisma.js";
import { addEvent as addTimelineEntry } from "./dealTimelineService.js";
import { generateNegotiationInsights } from "./ai/negotiationEngine.js";
import { extractOfferFromEmail, OfferTerms } from "./ai/offerExtractionService.js";
import { sendNegotiationReply } from "./email/sendOutbound.js";

/**
 * Extracts offer terms from the latest email in a deal's thread.
 */
export async function extractOffer(dealId: string, userId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, userId },
    include: { timeline: { include: { email: true }, orderBy: { createdAt: 'desc' } } } // Simplified relation
  });
  if (!deal) throw new Error("Deal not found");

  // Find the latest inbound email to process
  const latestEmail = await prisma.inboundEmail.findFirst({
      where: { deal: { id: dealId } }, // This relation needs to be added
      orderBy: { receivedAt: 'desc' }
  });

  if (!latestEmail?.body) {
    throw new Error("No email content found to extract offer from.");
  }

  const offerTerms = await extractOfferFromEmail(latestEmail.body);

  const negotiation = await prisma.dealNegotiation.upsert({
    where: { dealId },
    update: {
      status: "offer_received",
      offerTerms: offerTerms as any,
      history: { push: { type: "offer_received", terms: offerTerms, date: new Date() } } as any,
    },
    create: {
      dealId,
      userId,
      status: "offer_received",
      offerTerms: offerTerms as any,
      history: [{ type: "offer_received", terms: offerTerms, date: new Date() }] as any,
    }
  });

  await addTimelineEntry(dealId, {
    type: "offer_extracted",
    message: `Offer of ${offerTerms.currency} ${offerTerms.price} extracted from email.`,
    metadata: { terms: offerTerms },
  });

  return negotiation;
}

/**
 * Proposes a counter-offer.
 */
export async function proposeCounter(dealId: string, userId: string, counterTerms: Partial<OfferTerms>) {
  const negotiation = await prisma.dealNegotiation.findUnique({ where: { dealId } });
  if (!negotiation) throw new Error("Negotiation not found for this deal.");

  const updatedNegotiation = await prisma.dealNegotiation.update({
    where: { dealId },
    data: {
      status: "counter_sent",
      counterTerms: counterTerms as any,
      history: { push: { type: "counter_offer", terms: counterTerms, date: new Date() } } as any,
    }
  });

  await addTimelineEntry(dealId, {
    type: "counter_offer_sent",
    message: `Counter-offer sent with new terms.`,
    metadata: { terms: counterTerms },
  });
  return updatedNegotiation;
}

/**
 * Accepts the current offer terms.
 */
export async function acceptOffer(dealId: string, userId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { stage: "CONTRACT_SENT" } });
  const negotiation = await prisma.dealNegotiation.update({
    where: { dealId },
    data: {
      status: "accepted",
      history: { push: { type: "accepted", date: new Date() } } as any,
    },
  });
  await addTimelineEntry(dealId, {
    type: "offer_accepted",
    message: "Offer terms have been accepted.",
    createdById: userId,
  });
  // Here you would trigger contract creation
  console.log(`[DEAL] Offer accepted for ${dealId}. Triggering contract creation...`);
  return negotiation;
}

/**
 * Declines the offer.
 */
export async function declineOffer(dealId: string, userId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { stage: "CLOSED_LOST" } });
  const negotiation = await prisma.dealNegotiation.update({
    where: { dealId },
    data: {
      status: "declined",
      history: { push: { type: "declined", date: new Date() } } as any,
    },
  });
  await addTimelineEntry(dealId, {
    type: "offer_declined",
    message: "Offer was declined.",
    createdById: userId,
  });
  return negotiation;
}

/**
 * Generates an AI-suggested reply without sending it.
 */
export async function suggestReply(dealId: string, userId: string) {
  const deal = await prisma.deal.findFirst({ where: { id: dealId, userId } });
  if (!deal) throw new Error("Deal not found");

  const insights = await generateNegotiationInsights(dealId);
  return {
    suggestedReply: insights.finalScript,
    insights,
  };
}

/**
 * Sends an AI-generated reply.
 */
export async function sendSuggestedReply(dealId: string, userId: string, message: string) {
    const deal = await prisma.deal.findFirst({ where: { id: dealId, userId }, include: { Talent: true } });
    if (!deal) throw new Error("Deal not found");

    const toEmail = deal.brandEmail; // Assuming brandEmail is on the Deal model
    const fromEmail = deal.Talent?.user?.email; // Assuming relation exists

    if (!toEmail || !fromEmail) throw new Error("Sender or recipient email is missing.");

    await sendNegotiationReply({
        to: toEmail,
        from: fromEmail,
        subject: `Re: ${deal.brandName} x ${deal.talent.name}`,
        body: message,
    });

    await addTimelineEntry(dealId, {
      type: "negotiation_reply_sent",
      message: "Sent a reply to the brand.",
      metadata: { message },
    });
}

/**
 * Retrieves the negotiation history for a deal.
 */
export async function getHistory(dealId: string, userId: string) {
  const negotiation = await prisma.dealNegotiation.findFirst({
    where: { dealId, deal: { userId } }
  });
  return negotiation?.history || [];
}
