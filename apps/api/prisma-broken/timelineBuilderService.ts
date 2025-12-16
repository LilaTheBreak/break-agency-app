import { PrismaClient, CreatorBundle } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

/**
 * Generates a detailed campaign timeline based on a selected creator bundle.
 * @param bundle The CreatorBundle object.
 * @returns The newly created CampaignAutoPlan with its timeline items.
 */
export const generateTimelineFromBundle = async (bundle: CreatorBundle) => {
  if (!bundle.briefId) {
    throw new Error('Bundle is not associated with a brief.');
  }

  // 1. Create a CampaignAutoPlan linked to the brief
  const plan = await prisma.campaignAutoPlan.create({
    data: {
      briefId: bundle.briefId,
      aiSummary: {
        title: `Campaign Plan based on ${bundle.type} Bundle`,
        description: bundle.aiSummary,
      },
      aiBudget: bundle.budget,
      aiDeliverables: bundle.deliverables,
    },
  });

  // 2. Generate timeline items based on the plan
  const startDate = new Date();
  const timelineItems = [
    { type: 'outreach', title: 'Send Outreach to Creators', duration: 2 },
    { type: 'contract', title: 'Finalize Contracts', duration: 5 },
    { type: 'briefing', title: 'Creative Briefing Call', duration: 2 },
    { type: 'draft1', title: 'Creators Submit Draft 1', duration: 7 },
    { type: 'review', title: 'Brand Review of Draft 1', duration: 3 },
    { type: 'draft2', title: 'Creators Submit Final Drafts', duration: 4 },
    { type: 'posting', title: 'Content Goes Live', duration: 1 },
    { type: 'reporting', title: 'Initial Performance Report', duration: 7 },
  ];

  let currentDate = startDate;
  const itemsToCreate = [];
  let sequence = 0;

  for (const item of timelineItems) {
    currentDate = addDays(currentDate, item.duration);
    itemsToCreate.push({
      planId: plan.id,
      sequence: sequence++,
      week: Math.floor(sequence / 2), // Simple week calculation
      title: item.title,
      type: item.type,
      dueDate: currentDate,
      status: 'pending',
    });
  }

  // 3. Save timeline items to the database
  await prisma.campaignTimelineItem.createMany({
    data: itemsToCreate,
  });

  // 4. Return the complete plan with items
  return await prisma.campaignAutoPlan.findUnique({
    where: { id: plan.id },
    include: { timelineItems: { orderBy: { sequence: 'asc' } } },
  });
};