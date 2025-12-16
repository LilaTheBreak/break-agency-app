import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';
import { determineNextMove } from './strategyEngine.js';
// Placeholders for Gmail integration
const gmail = { createDraft: async (p: any) => console.log('DRAFTING:', p), sendEmail: async (p: any) => console.log('SENDING:', p) };

async function detectBrandIntent(message: string): Promise<string> {
  const result = await aiClient.json(`
    Classify the user's intent from the following email message.
    Message: "${message}"
    Categories: ["price_pushback", "timeline_change", "scope_expansion", "budget_clip", "approval_gate", "stalling", "legal_concern", "positive_signal", "question"]
    Respond with JSON: { "intent": "category" }
  `);
  return (result as any)?.intent || 'unknown';
}

async function loadNegotiationMemory(threadId: string) {
  return prisma.negotiationTurn.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
  });
}

const replyGenerationPrompt = (context: any) => `
You are an AI negotiation agent. Your goal is to reply to the brand's latest message based on the provided strategy.

**Negotiation History (Chronological):**
${context.history.map((turn: any) => `${turn.actor}: ${turn.body}`).join('\n---\n')}

**Brand's Latest Message:**
${context.lastMessage}

**Brand's Intent:** ${context.brandIntent}

**Your Strategy for this Reply:**
- Posture: ${context.strategy.posture}
- Target Price: ${context.strategy.targetPrice}
- Key Arguments: ${context.strategy.arguments.join(', ')}
- Tone: ${context.strategy.tone}

Generate the email reply body as a string.
Respond with JSON: { "reply": "The full email body text..." }
`;

export async function generateRealtimeNegotiationReply(threadId: string, autoSend = false) {
  // 1. Fetch all context
  const thread = await prisma.negotiationThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new Error('Negotiation thread not found.');

  const memory = await loadNegotiationMemory(threadId);
  const lastBrandTurn = memory.filter(t => t.actor === 'brand').pop();
  if (!lastBrandTurn) throw new Error('No message from the brand to reply to.');

  const insights = await prisma.negotiationInsight.findFirst({
    where: { dealDraft: { email: { dealDrafts: { some: { id: thread.dealId || '' } } } } },
    orderBy: { createdAt: 'desc' },
  });
  if (!insights || !insights.recommendedRange) throw new Error('Negotiation insights not found.');

  // 2. Analyze and Strategize
  const brandIntent = await detectBrandIntent(lastBrandTurn.body);
  const strategy = determineNextMove({
    brandIntent,
    negotiationStyle: (insights.talentContext as any)?.negotiationStyle || 'BALANCED',
    recommendedRange: insights.recommendedRange as any,
    currentOffer: (insights.dealDraft as any)?.offerValue || 0,
  });

  // 3. Generate AI response
  const prompt = replyGenerationPrompt({
    history: memory,
    lastMessage: lastBrandTurn.body,
    brandIntent,
    strategy,
  });
  const { reply } = await aiClient.json(prompt) as { reply: string };

  // 4. Save the new turn to memory
  await prisma.negotiationTurn.create({
    data: {
      threadId,
      actor: 'ai',
      body: reply,
      aiStrategy: strategy as any,
      aiIntent: brandIntent, // Storing the detected intent of the message we're replying to
    },
  });

  // 5. Draft or Send the email
  const agentPolicy = await prisma.agentPolicy.findFirst({ where: { userId: thread.userId } });
  const shouldAutoSend = autoSend || agentPolicy?.autoSendNegotiation;

  const emailPayload = {
    to: thread.brandEmail,
    subject: `Re: ${thread.brandName} Partnership`, // Simplified subject
    body: reply,
  };

  if (shouldAutoSend) {
    await gmail.sendEmail(emailPayload);
    console.log(`[NEGOTIATION ENGINE] Auto-sent reply for thread ${threadId}`);
  } else {
    await gmail.createDraft(emailPayload);
    console.log(`[NEGOTIATION ENGINE] Saved draft reply for thread ${threadId}`);
  }

  // 6. Log the action
  await prisma.aIResponseLog.create({
    data: {
      talentId: 'placeholder_talent_id', // This should be linked properly
      action: 'negotiation_reply',
      message: reply,
    },
  });

  return { reply, policyAutoSend: agentPolicy?.autoSendNegotiation, savedAsDraft: !shouldAutoSend };
}