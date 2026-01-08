import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { sendTemplatedEmail } from "../email/emailClient.js";
import { gmailQueue } from "../../worker/queues.js";

const DRY_RUN = process.env.AI_AGENT_DRY_RUN !== "false";

/**
 * INBOX_AUTOREPLY
 * Reply to an email using an AI-generated message.
 */
export async function performInboxReply(params: { userId: string; emailId: string; context?: any }) {
  const { userId, emailId, context } = params;

  const email = await prisma.inboundEmail.findUnique({
    where: { id: emailId }
  });

  if (!email) {
    console.warn("AI Agent: email not found", { userId, emailId });
    return;
  }

  const replyText = await generateSmartReply(email, context);

  if (DRY_RUN) {
    await logAIAgent("INBOX_REPLY", userId, {
      emailId,
      reply: replyText,
      dryRun: true
    });
    return;
  }

  await sendTemplatedEmail({
    to: email.userId,
    template: "ai-auto-reply",
    subject: `Re: ${email.subject}`,
    data: { replyText }
  });

  await logAIAgent("INBOX_REPLY", userId, {
    emailId,
    sent: true
  });
}

/**
 * NEGOTIATE_DEAL
 * Expand a deal draft into a recommended negotiation response.
 */
export async function performDealNegotiation(params: { userId: string; dealId: string; context?: any }) {
  const { userId, dealId } = params;

  const deal = await prisma.dealDraft.findUnique({
    where: { id: dealId }
  });

  if (!deal) {
    console.warn("AI Agent: deal not found", { userId, dealId });
    return;
  }

  const strategy = await generateNegotiationStrategy(deal);

  await logAIAgent("NEGOTIATE_DEAL", userId, {
    dealId,
    strategy
  });
}

/**
 * OUTREACH
 * Automatically draft & send outreach to brands.
 */
export async function performOutreach(params: { userId: string; targetBrand?: string; context?: any }) {
  const { userId, targetBrand } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return;

  const outreachTargets = targetBrand ? [targetBrand] : await pickOutreachTargets(userId);

  const generated = await generateOutreach(user, outreachTargets);

  await logAIAgent("OUTREACH", userId, {
    outreachTargets,
    draft: generated,
    dryRun: DRY_RUN
  });

  if (!DRY_RUN) {
    for (const draft of generated) {
      await sendTemplatedEmail({
        to: draft.to,
        template: "ai-outreach",
        subject: draft.subject,
        data: draft
      });
    }
  }
}

// ----- Support functions -----

async function generateSmartReply(email: any, context: any) {
  const personaTone = context?.persona?.toneKeywords || "professional, friendly";
  const style = context?.persona?.writingStyle || "short, clear, UK-English";
  const memoryHints = (context?.memories || [])
    .slice(0, 5)
    .map((m: any) => `• ${m.topic || "note"}: ${JSON.stringify(m.content)}`)
    .join("\n");

  return `
${personaTone.toUpperCase()} STYLE RESPONSE

Writing style: ${style}

Recent relevant memory:
${memoryHints}

AI Reply:
Thanks for reaching out — I’ll get back shortly! (AI Draft)
`;
}

async function generateNegotiationStrategy(deal: any) {
  return {
    recommendedRate: Math.round((deal?.baselineValue ?? 1000) * 1.25),
    keyPoints: [
      "Leverage creator category strength",
      "Push for usage rights upsell",
      "Propose 2-3 video bundle"
    ]
  };
}

async function pickOutreachTargets(userId: string) {
  // placeholder — will be replaced with real brand list in S15-step5
  return ["brand@example.com"];
}

async function generateOutreach(user: any, targets: string[]) {
  return targets.map((t) => ({
    to: t,
    subject: `${user.name} x Brand Partnership Opportunity`,
    message: `Hi — We'd love to explore a collaboration with ${user.name}. (AI Draft)`
  }));
}

async function logAIAgent(type: string, userId: string, metadata: Record<string, any>) {
  // Log to AIPromptHistory instead
  const talentRecord = await prisma.talent.findUnique({
    where: { userId },
    select: { id: true }
  });

  if (talentRecord?.id) {
    await prisma.aIPromptHistory.create({
      data: {
        id: `prompthistory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        creatorId: talentRecord.id,
        prompt: type,
        response: JSON.stringify(metadata),
        category: type
      }
    });
  }

  await sendSlackAlert(`AI Agent ran: ${type}`, metadata);
}
