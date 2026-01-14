import prisma from '../../lib/prisma';

// Note: negotiationMessage model doesn't exist in schema
// Stubbing out to prevent errors - this feature is not fully implemented
export async function recordThreadMessage(threadId: string, data: any) {
  // Return stub message object
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    threadId,
    direction: data.direction,
    subject: data.subject || "",
    body: data.body || "",
    snippet: data.snippet || "",
    amount: data.amount ?? null,
    confidence: data.confidence ?? null,
    raw: data.raw ?? {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Original implementation (commented out - model doesn't exist):
  // return prisma.negotiationMessage.create({
  //   data: {
  //     threadId,
  //     direction: data.direction,
  //     subject: data.subject || "",
  //     body: data.body || "",
  //     snippet: data.snippet || "",
  //     amount: data.amount ?? null,
  //     confidence: data.confidence ?? null,
  //     raw: data.raw ?? {}
  //   }
  // });
}
