import prisma from "../lib/prisma.js";
import { buildCampaignPlan } from "./ai/campaignAutoBuilder.js";

export async function generateAutoCampaignPlan({
  briefId,
  bundleId,
  createdBy
}: {
  briefId?: string;
  bundleId?: string;
  createdBy?: string;
}) {
  const brief = briefId
    ? await prisma.brandBrief.findUnique({
        where: { id: briefId }
      })
    : null;

  const creators = bundleId
    ? await prisma.bundleCreator.findMany({
        where: { bundleId },
        include: { creator: true }
      })
    : [];

  const ai = await buildCampaignPlan({
    brief,
    creators
  });

  const plan = await prisma.campaignAutoPlan.create({
    data: {
      briefId,
      bundleId,
      createdBy,
      aiSummary: ai.summary,
      aiTimeline: ai.timeline,
      aiDeliverables: ai.deliverables,
      aiBudget: ai.budget,
      aiRisks: ai.risks,
      aiContracts: ai.contracts
    }
  });

  if (Array.isArray(ai.timeline) && ai.timeline.length) {
    await prisma.campaignTimelineItem.createMany({
      data: ai.timeline.map((t: any) => ({
        planId: plan.id,
        week: t.week,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate ? new Date(t.dueDate) : null
      }))
    });
  }

  if (Array.isArray(ai.deliverables) && ai.deliverables.length) {
    await prisma.campaignDeliverableAuto.createMany({
      data: ai.deliverables.map((d: any) => ({
        planId: plan.id,
        creatorId: d.creatorId,
        platform: d.platform,
        type: d.type,
        rounds: d.rounds,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        aiNotes: ""
      }))
    });
  }

  return plan;
}
