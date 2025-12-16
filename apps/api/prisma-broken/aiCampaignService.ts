import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AutoPlanInput {
  goal: string;
  budgetMin: number;
  budgetMax: number;
  categories: string[];
  references?: string;
  notes?: string;
  userId: string;
  brandName: string;
}

/**
 * Simulates a call to an AI client to generate a full campaign plan.
 */
const aiClient = {
  generatePlan: async (input: AutoPlanInput) => {
    // Mock AI response based on input
    const concept = `A campaign focused on ${input.goal} for the ${input.categories.join(', ')} space.`;
    const summary = `This plan outlines a multi-platform strategy to achieve ${input.goal} by leveraging a mix of creators to maximize reach and engagement within a budget of $${input.budgetMin}-$${input.budgetMax}.`;

    return {
      concept,
      summary,
      targetAudience: 'Gen Z and Millennials (18-34) interested in sustainable and authentic brands.',
      deliverables: [
        { creator: 'Creator A (Macro)', platform: 'TikTok', type: '60s Video', count: 2 },
        { creator: 'Creator B (Micro)', platform: 'Instagram', type: 'Reels + 3 Stories', count: 1 },
        { creator: 'Creator C (Micro)', platform: 'Instagram', type: 'Reels + 3 Stories', count: 1 },
      ],
      timeline: [
        { week: 1, title: 'Creator Outreach & Negotiation' },
        { week: 2, title: 'Contracts & Briefing' },
        { week: 3, title: 'Content Creation & Draft Review' },
        { week: 4, title: 'Content Goes Live & Initial Reporting' },
      ],
      suggestedCreators: ['creator_id_1', 'creator_id_2', 'creator_id_3'],
      fees: { total: (input.budgetMin + input.budgetMax) / 2, breakdown: [{ creator: 'Creator A', fee: 5000 }] },
      risks: [{ name: 'Creator Availability', level: 'Medium', mitigation: 'Have backup creators identified.' }],
      outreachCopy: `Hi [Creator Name], we're launching a campaign for [Brand Name] focused on ${input.goal} and think you'd be a perfect fit!`,
    };
  },
};

/**
 * Generates an AI campaign plan and saves it to the database.
 * @param input The user's request for the campaign.
 * @returns The newly created CampaignAutoPlan with its related items.
 */
export const generateAutoPlan = async (input: AutoPlanInput) => {
  const aiResult = await aiClient.generatePlan(input);

  // Save the plan to the database
  const campaignPlan = await prisma.campaignAutoPlan.create({
    data: {
      createdBy: input.userId,
      aiSummary: { concept: aiResult.concept, summary: aiResult.summary },
      aiTimeline: aiResult.timeline,
      aiBudget: aiResult.fees,
      aiDeliverables: aiResult.deliverables,
      aiRisks: aiResult.risks,
      metadata: {
        targetAudience: aiResult.targetAudience,
        suggestedCreators: aiResult.suggestedCreators,
        outreachCopy: aiResult.outreachCopy,
      },
      timelineItems: {
        create: aiResult.timeline.map((item, index) => ({
          week: item.week,
          title: item.title,
          sequence: index,
        })),
      },
      deliverables: {
        create: aiResult.deliverables.map(item => ({
          creatorId: 'pending', // Placeholder until creator is confirmed
          platform: item.platform,
          type: item.type,
          aiNotes: `Part of an auto-generated plan for ${item.creator}.`,
        })),
      },
    },
    include: { timelineItems: true, deliverables: true },
  });

  return campaignPlan;
};