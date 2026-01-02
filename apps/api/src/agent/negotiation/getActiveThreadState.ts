import prisma from "../../lib/prisma.js";

// Note: negotiationMessage model doesn't exist in schema
// Stubbing out to prevent errors - this feature is not fully implemented
export async function getActiveThreadState(threadId: string) {
  // Return stub state
  return {
    messages: [],
    lastOffer: null,
    history: [],
    summary: [],
    last: null
  };

  // Original implementation (commented out - model doesn't exist):
  // const messages = await prisma.negotiationMessage.findMany({
  //   where: { threadId },
  //   orderBy: { createdAt: "asc" }
  // });
  //
  // const last = messages[messages.length - 1];
  // const offers = messages.filter((m) => m.amount != null);
  //
  // return {
  //   messages,
  //   lastOffer: offers[offers.length - 1] ?? null,
  //   history: messages,
  //   summary: messages.map((m) => ({
  //     direction: m.direction,
  //     amount: m.amount,
  //     snippet: m.snippet,
  //     time: m.createdAt
  //   })),
  //   last
  // };
}
