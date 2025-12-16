import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const conceptGeneratorPrompt = (context: {
  deliverableType: string;
  platform: string;
  brandName: string;
  campaignGoals: string;
  creatorPersona: any;
  options: any;
}) => `
You are a world-class creative director and viral content strategist. Your task is to generate a complete, engaging, and platform-specific creative concept for a deliverable.

**Context:**
- **Deliverable Type:** ${context.deliverableType}
- **Target Platform:** ${context.platform}
- **Brand:** ${context.brandName}
- **Campaign Goals:** ${context.campaignGoals}
- **Creator Persona:** ${JSON.stringify(context.creatorPersona, null, 2)}
- **Creative Options:** ${JSON.stringify(context.options, null, 2)}

**Instructions:**
Generate a comprehensive, structured JSON creative concept.
1.  **conceptName**: Give the concept a catchy name (e.g., "The Unboxing Surprise").
2.  **conceptDescription**: A one-paragraph summary of the creative idea.
3.  **scriptOutline**: A 3-5 point script outline or storyboard for the video.
4.  **shotList**: Suggest 3-5 specific shots, camera angles, or visual styles.
5.  **hooks**: Propose 3 attention-grabbing hooks for the video's opening, tailored to the platform.
6.  **aesthetic**: Describe the visual aesthetic (e.g., "cinematic, warm tones, fast cuts").
7.  **brandSafety**: List any potential brand safety flags to be aware of.
8.  **score**: Provide an overall score (0-100) for this concept's potential success.

**JSON Output Schema:**
{
  "conceptName": "string",
  "conceptDescription": "string",
  "scriptOutline": ["string"],
  "shotList": ["string"],
  "hooks": ["string"],
  "aesthetic": { "summary": "string" },
  "brandSafety": { "flags": ["string"] },
  "score": "number"
}
`;

/**
 * The main orchestrator for the AI creative concept generation pipeline.
 * @param deliverableId - The ID of the DeliverableItem to generate a concept for.
 * @param platform - The target platform.
 * @param options - Creative options like tone and style.
 */
export async function generateConcept(deliverableId: string, platform: string, options: any) {
  // 1. Load Context
  const deliverable = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId },
    include: { deal: { include: { user: { include: { personaProfile: true } }, dealDraft: true } } },
  });

  if (!deliverable || !deliverable.deal.user) {
    throw new Error('Deliverable context is incomplete for concept generation.');
  }

  // 2. Run AI Concept Generation
  const result = await aiClient.json(conceptGeneratorPrompt({
    deliverableType: deliverable.type,
    platform,
    brandName: deliverable.deal.brandName || 'the brand',
    campaignGoals: (deliverable.deal.dealDraft?.notes as string) || 'Drive awareness.',
    creatorPersona: deliverable.deal.user.personaProfile || { toneKeywords: 'friendly' },
    options,
  })) as any;

  // 3. Save the new concept to the database
  const concept = await prisma.creativeConcept.create({
    data: {
      deliverableId,
      platform,
      conceptName: result.conceptName,
      conceptDescription: result.conceptDescription,
      scriptOutline: result.scriptOutline,
      shotList: result.shotList,
      hooks: result.hooks,
      aesthetic: result.aesthetic,
      brandSafety: result.brandSafety,
      score: result.score,
      modelVersion: 'v1.0',
    },
  });

  console.log(`[AI CONCEPTOR] Successfully generated concept "${result.conceptName}" for deliverable ${deliverableId}.`);
  return concept;
}