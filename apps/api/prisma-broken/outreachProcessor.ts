import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { generateInitialOutreach } from '../../services/ai/aiOutreach.js';

/**
 * Worker to generate an AI outreach suggestion for a lead.
 */
export default async function outreachProcessor(job: Job<{ leadId: string; userId: string }>) {
  const { leadId, userId } = job.data;
  console.log(`[WORKER] Generating outreach for lead: ${leadId}`);

  // 1. Build Input
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { personaProfile: true } });

  if (!lead || !user) throw new Error('Lead or user not found.');

  const context = {
    creatorPersona: user.personaProfile,
    brandInfo: {
      name: lead.brandName,
      industry: lead.industry,
      signals: (lead.notes as any)?.signals || [],
    },
    type: 'initial',
  };

  // 2. Generate Outreach
  const suggestion = await generateInitialOutreach(context) as any;

  // 3. Save Suggestion
  await prisma.outreachSuggestion.create({
    data: {
      userId,
      leadId,
      subject: suggestion.subject,
      body: suggestion.body,
      confidence: suggestion.confidence,
    },
  });
}