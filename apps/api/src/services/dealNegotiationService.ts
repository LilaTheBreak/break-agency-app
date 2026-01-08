import prisma from "../lib/prisma.js";

export type OfferTerms = {
  currency: string;
  price: number;
};

/**
 * Extracts offer terms from the latest email in a deal's thread.
 */
export async function extractOffer(dealId: string, userId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, userId }
  });
  if (!deal) throw new Error("Deal not found");

  // Find the latest inbound email to process
  const latestEmail = await prisma.inboundEmail.findFirst({
      where: { dealId },
      orderBy: { receivedAt: 'desc' }
  });

  if (!latestEmail?.body) {
    throw new Error("No email content found to extract offer from.");
  }

  // Parse basic offer terms from email
  const offerTerms: OfferTerms = {
    currency: "USD",
    price: 0
  };

  const negotiation = await prisma.dealNegotiation.upsert({
    where: { dealId },
    update: {
      status: "offer_received",
      offerTerms: offerTerms as any,
    },
    create: {
      dealId,
      status: "offer_received",
      offerTerms: offerTerms as any,
    }
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
    }
  });

  return updatedNegotiation;
}

/**
 * Accepts the current offer terms.
 */
export async function acceptOffer(dealId: string, userId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { stage: "won" as any } });
  const negotiation = await prisma.dealNegotiation.update({
    where: { dealId },
    data: {
      status: "accepted",
    },
  });
  return negotiation;
}

/**
 * Declines the offer.
 */
export async function declineOffer(dealId: string, userId: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { stage: "lost" as any } });
  const negotiation = await prisma.dealNegotiation.update({
    where: { dealId },
    data: {
      status: "declined",
    },
  });
  return negotiation;
}

/**
 * Generates an AI-suggested reply without sending it.
 */
export async function suggestReply(dealId: string, userId: string) {
  const deal = await prisma.deal.findFirst({ where: { id: dealId, userId } });
  if (!deal) throw new Error("Deal not found");

  return {
    suggestedReply: "Please review the proposed terms.",
    insights: {},
  };
}

/**
 * Sends an AI-generated reply.
 */
export async function sendSuggestedReply(dealId: string, userId: string, message: string) {
    const deal = await prisma.deal.findFirst({ where: { id: dealId, userId } });
    if (!deal) throw new Error("Deal not found");

    // Placeholder for sending reply
    console.log(`Sending reply for deal ${dealId}: ${message}`);
}

/**
 * Retrieves the negotiation history for a deal.
 */
export async function getHistory(dealId: string, userId: string) {
  const negotiation = await prisma.dealNegotiation.findFirst({
    where: { dealId }
  });
  return negotiation ? [] : [];
}
