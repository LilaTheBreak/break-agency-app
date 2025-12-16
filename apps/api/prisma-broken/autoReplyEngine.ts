import prisma from '../../lib/prisma.js';
import { aiClient } from '../../services/ai/aiClient.js';
import { applyPersona } from '../../services/ai/persona/personaApplier.js';

const autoReplyPrompt = (context: {
  emailBody: string;
  category: string;
  brandName: string;
  predictedValue: number;
}) => `
You are an AI assistant for a talent agent. Your task is to draft a reply to an inbound email based on its category and potential value.

**Inbound Email Category:** ${context.category}
**Brand Name:** ${context.brandName}
**Predicted Deal Value:** £${context.predictedValue}

**Instructions:**
Based on the category, draft an appropriate reply.
- If 'deal' or 'gifting', express interest and suggest next steps (e.g., "Thanks for reaching out! We're excited to learn more. What's the best way to discuss the details?").
- If 'invite', politely acknowledge the invitation.
- If 'spam', write a polite but firm declination.

**JSON Output Schema:**
{ "subject": "string", "body": "string" }
`;

/**
 * The main orchestrator for the auto-reply pipeline.
 * @param emailId - The ID of the InboundEmail to process.
 */
export async function generateAutoReply(emailId: string) {
  // 1. Load all necessary context
  const email = await prisma.inboundEmail.findUnique({ where: { id: emailId }, include: { user: { include: { agentPolicy: true, personaProfile: true, talents: true } } } });
  if (!email || !email.user) throw new Error('Email or associated user not found.');

  const { user } = email;
  const talent = user.talents[0]; // Assume first talent profile

  // 2. Detect category and predict value (using stubs for S10/S11)
  const category = email.aiCategory || 'deal';
  const predictedValue = (email.extractedData as any)?.offerValue || 5000;
  const brandName = email.aiBrand || 'the brand';

  // 3. Select rule and determine tone (simplified)
  // In a real app, you'd fetch and evaluate AIAutoReplyRule records here.

  // 4. Call AI to generate the draft reply
  const draft = await aiClient.json(autoReplyPrompt({
    emailBody: email.body || '',
    category,
    brandName,
    predictedValue,
  })) as { subject: string; body: string };

  // 5. Apply Persona (S72)
  const finalBody = user.personaProfile ? await applyPersona(draft.body, user.personaProfile) : draft.body;

  // 6. Save results (upsert for idempotency)
  const autoReply = await prisma.inboxAutoReply.upsert({
    where: { emailId },
    create: {
      userId: user.id,
      talentId: talent?.id,
      emailId,
      brandEmail: email.from,
      brandName,
      category,
      status: 'draft',
      replyText: finalBody,
      metadata: { subject: draft.subject },
    },
    update: {
      replyText: finalBody,
      metadata: { subject: draft.subject },
      status: 'draft',
    },
  });

  // Log the execution
  await prisma.aIAgentExecutionLog.create({
    data: { userId: user.id, talentId: talent.id, action: 'auto_reply_generated', output: { emailId, category } },
  });

  // 7. Auto-send if policy allows
  if (user.agentPolicy?.autoReply && !user.agentPolicy.sandboxMode) {
    console.log(`[AUTO-SEND] Sending reply for email ${emailId}.`);
    // await gmailService.sendEmail({ to: email.from, subject: draft.subject, body: finalBody });
    await prisma.inboxAutoReply.update({ where: { id: autoReply.id }, data: { status: 'sent' } });
  }

  return autoReply;
}