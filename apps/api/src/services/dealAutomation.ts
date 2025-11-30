import prisma from "../lib/prisma.js";
import { sendSlackAlert } from "../integrations/slack/slackClient.js";

const THREE_DAYS_MS = 1000 * 60 * 60 * 24 * 3;

export async function runDealAutomation() {
  const deals = await prisma.dealThread.findMany({
    include: {
      events: {
        orderBy: { createdAt: "asc" }
      }
    }
  });

  for (const deal of deals) {
    await evaluateDeal(deal);
  }

  return { ok: true, scanned: deals.length };
}

async function evaluateDeal(deal: any) {
  const now = Date.now();
  const emailEvents = (deal.events || []).filter((e: any) => (e.type || "").toLowerCase() === "email");
  const lastEmail = emailEvents[emailEvents.length - 1];

  // Rule: Brand not replying for >3 days
  if (lastEmail && now - new Date(lastEmail.createdAt).getTime() > THREE_DAYS_MS) {
    await createAutoEvent(deal.id, "Brand has not replied for 3 days — marking as AT RISK", "AUTO_RISK");
    await prisma.dealThread.update({
      where: { id: deal.id },
      data: { status: "AT_RISK" }
    });
  }

  // Rule: Missing contract while negotiating
  if (deal.stage === "NEGOTIATING") {
    const hasContractEvent = (deal.events || []).some((e: any) =>
      String(e.type || "").toLowerCase().includes("contract")
    );
    if (!hasContractEvent) {
      await createAutoEvent(deal.id, "Contract missing — flagging this deal", "AUTO_MISSING_CONTRACT");
    }
  }

  // Rule: Auto advance simple milestones
  if (deal.stage === "CONTENT_SUBMITTED") {
    const brandFeedback = (deal.events || []).some((e: any) => String(e.type || "").toLowerCase() === "brand_feedback");
    if (brandFeedback) {
      await autoAdvance(deal.id, "APPROVED");
    }
  }

  if (deal.stage === "APPROVED") {
    const paymentConfirmed = (deal.events || []).some((e: any) =>
      String(e.type || "").toLowerCase().includes("payment")
    );
    if (paymentConfirmed) {
      await autoAdvance(deal.id, "PAYMENT_SENT");
    }
  }
}

async function createAutoEvent(dealId: string, message: string, type: string) {
  return prisma.dealEvent.create({
    data: {
      dealId,
      type,
      actorId: null,
      message: `AUTO: ${message}`
    }
  });
}

async function autoAdvance(dealId: string, nextStage: string) {
  await prisma.dealThread.update({
    where: { id: dealId },
    data: { stage: nextStage }
  });

  await createAutoEvent(dealId, `Automatically moved deal to stage: ${nextStage}`, "AUTO_STAGE_CHANGE");
  if (nextStage === "PAYMENT_SENT") {
    await sendSlackAlert("Deal auto-advanced to PAYMENT_SENT", { dealId: dealId });
  }
}
