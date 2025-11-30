import prisma from "../../lib/prisma.js";

export async function recordThreadMessage(threadId: string, data: any) {
  return prisma.negotiationMessage.create({
    data: {
      threadId,
      direction: data.direction,
      subject: data.subject || "",
      body: data.body || "",
      snippet: data.snippet || "",
      amount: data.amount ?? null,
      confidence: data.confidence ?? null,
      raw: data.raw ?? {}
    }
  });
}
