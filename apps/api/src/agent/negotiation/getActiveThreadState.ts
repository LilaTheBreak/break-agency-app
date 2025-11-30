import prisma from "../../lib/prisma.js";

export async function getActiveThreadState(threadId: string) {
  const messages = await prisma.negotiationMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" }
  });

  const last = messages[messages.length - 1];
  const offers = messages.filter((m) => m.amount != null);

  return {
    messages,
    lastOffer: offers[offers.length - 1] ?? null,
    history: messages,
    summary: messages.map((m) => ({
      direction: m.direction,
      amount: m.amount,
      snippet: m.snippet,
      time: m.createdAt
    })),
    last
  };
}
