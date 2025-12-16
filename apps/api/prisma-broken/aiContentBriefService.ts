import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const briefGeneratorPrompt = (context: {
  deliverableType: string;
  brandName: string;
  campaignGoals: string;
  creatorPersona: any;
}) => `
You are a world-class creative director and strategist at a top talent agency. Your task is to generate a complete creative brief for a specific deliverable.

**Context:**
- **Deliverable:** ${context.deliverableType}
- **Brand:** ${context.brandName}
- **Campaign Goals:** ${context.campaignGoals}
- **Creator Persona:** ${JSON.stringify(context.creatorPersona, null, 2)}

**Instructions:**
Generate a comprehensive, structured JSON creative brief.
1.  **generateBriefJson**: Write a core creative concept that aligns the brand's goals with the creator's persona.
2.  **generateScriptOutline**: Create a 3-5 point script outline or storyboard.
3.  **generateShotList**: Suggest 3-5 specific shots or camera angles.
4.  **generateHooks**: Propose 3 attention-grabbing hooks for the video's opening.
5.  **generateComplianceChecklist**: List key compliance points (e.g., "Must include #ad", "Do not show competitor logos").
6.  **generateMissingInfoChecklist**: List questions to ask the brand to clarify any ambiguities (e.g., "What is the specific link for the CTA?").

**JSON Output Schema:**
{
  "aiContentBrief": { "concept": "string", "keyMessage": "string" },
  "aiScriptOutline": ["string"],
  "aiShotList": ["string"],
  "aiHooks": ["string"],
  "aiCompliance": ["string"],
  "aiMissingInfo": ["string"]
}
`;

/**
 * The main orchestrator for the AI content brief generation pipeline.
 * @param deliverableId - The ID of the DeliverableItem to generate a brief for.
 */
export async function generateBriefForDeliverable(deliverableId: string) {
  // 1. Load Context
  const deliverable = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId },
    include: {
      deal: {
        include: {
          user: { include: { personaProfile: true } },
          dealDraft: true,
        },
      },
    },
  });

  if (!deliverable || !deliverable.deal.user) {
    throw new Error('Deliverable context is incomplete for brief generation.');
  }

  // 2. Run AI Brief Generation
  const result = await aiClient.json(briefGeneratorPrompt({
    deliverableType: deliverable.type,
    brandName: deliverable.deal.brandName || 'the brand',
    campaignGoals: (deliverable.deal.dealDraft?.notes as string) || 'Drive awareness.',
    creatorPersona: deliverable.deal.user.personaProfile || { toneKeywords: 'friendly' },
  })) as any;

  // 3. Save the structured brief to the DeliverableItem
  const updatedDeliverable = await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: {
      aiContentBrief: result.aiContentBrief,
      aiScriptOutline: result.aiScriptOutline,
      aiShotList: result.aiShotList,
      aiHooks: result.aiHooks,
      aiCompliance: result.aiCompliance,
      aiMissingInfo: result.aiMissingInfo,
      status: 'draft', // Move back to draft as it now has a brief
    },
  });

  console.log(`[AI BRIEF WRITER] Successfully generated brief for deliverable ${deliverableId}.`);
  return updatedDeliverable;
}