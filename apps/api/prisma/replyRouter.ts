import prisma from '../../lib/prisma.js';
import { routeEmail } from './emailRoutingEngine.js';

/**
 * Routes an AI-generated reply: either sends it, or saves it as a suggestion.
 * @param reply - The AI-generated reply object.
 * @param context - The context of the original inbound email and deal.
 */
export async function routeAIGeneratedReply(reply: any, context: { email: any; dealThread: any; talent: any; policy: any }) {
  const { email, dealThread, talent, policy } = context;

  // Decide whether to auto-send based on AI confidence and agent policy
  const shouldAutoSend = policy?.autoSendNegotiation && !policy?.sandboxMode && reply.autoSend && reply.confidence > 0.8;

  if (shouldAutoSend) {
    console.log(`[REPLY ROUTER] Auto-sending reply for email ${email.id}`);
    // Use the S50 email routing engine to send the email
    await routeEmail('AI_BRAND_REPLY', {
      to: dealThread.brandEmail,
      subject: reply.aiSubject,
      body: reply.aiBody,
      talentId: talent.id,
    });

    // Log the sent message
    await prisma.negotiationMessage.create({
      data: {
        threadId: dealThread.id,
        sender: 'ai',
        body: reply.aiBody,
        aiGenerated: true,
        status: 'sent',
      },
    });
  } else {
    console.log(`[REPLY ROUTER] Saving reply as suggestion for email ${email.id}`);
    // Save as a suggestion for manual approval
    await prisma.negotiationReplySuggestion.create({
      data: {
        threadId: dealThread.id,
        emailId: email.id,
        userId: talent.userId,
        talentId: talent.id,
        aiSubject: reply.aiSubject,
        aiBody: reply.aiBody,
        autoSend: reply.autoSend,
        confidence: reply.confidence,
      },
    });
  }

  // Log the execution
  await prisma.aIAgentExecutionLog.create({
    data: { talentId: talent.id, action: 'brand_reply_generated', output: { ...reply, autoSent: shouldAutoSend } },
  });
}