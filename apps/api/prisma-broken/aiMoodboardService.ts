import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const moodboardGeneratorPrompt = (context: {
  brandAesthetic: any;
  creatorAesthetic: any;
  campaignGoals: string;
}) => `
You are an AI Art Director and Brand Strategist. Your task is to create a creative moodboard by fusing a brand's aesthetic with a creator's personal style for a specific campaign.

**Brand Aesthetic:**
- Keywords: ${context.brandAesthetic.keywords.join(', ')}
- Tone: ${context.brandAesthetic.tone}
- Visual Style: ${context.brandAesthetic.visualStyle}

**Creator's Aesthetic:**
- Keywords: ${context.creatorAesthetic.keywords.join(', ')}
- Tone: ${context.creatorAesthetic.tone}
- Visual Style: ${context.creatorAesthetic.visualStyle}

**Campaign Goals:**
"${context.campaignGoals}"

**Instructions:**
Generate a comprehensive, structured JSON moodboard.
1.  **fusionAesthetic**: Describe the new, fused aesthetic. Give it a catchy name (e.g., "Minimalist Tech-Glow").
2.  **referenceImages**: Describe 4-6 distinct reference images that capture this fused aesthetic. Be descriptive (e.g., "A close-up shot of a hand holding a glowing smartphone against a clean, white background, with soft shadows.").
3.  **colorPalette**: Provide a primary, secondary, and accent color palette with hex codes.
4.  **typography**: Suggest a headline and a body font pairing.
5.  **keywords**: List 5-7 keywords that define the final moodboard.

**JSON Output Schema:**
{
  "fusionAesthetic": { "name": "string", "description": "string" },
  "referenceImages": ["string"],
  "colorPalette": { "primary": "string", "secondary": "string", "accent": "string" },
  "typography": { "headline": "string", "body": "string" },
  "keywords": ["string"]
}
`;

/**
 * The main orchestrator for the AI moodboard generation pipeline.
 * @param conceptId - The ID of the CreativeConcept to generate a moodboard for.
 */
export async function generateMoodboard(conceptId: string) {
  // 1. Load Context
  const concept = await prisma.creativeConcept.findUnique({
    where: { id: conceptId },
    include: { deliverable: { include: { deal: { include: { user: { include: { personaProfile: true } }, dealDraft: true } } } } },
  });

  if (!concept || !concept.deliverable.deal.user) {
    throw new Error('Concept context is incomplete for moodboard generation.');
  }

  // Mocked aesthetics - in a real app, this would be extracted from BrandBriefs and CreatorPersonas
  const brandAesthetic = { keywords: ['Clean', 'Modern', 'Tech'], tone: 'Professional', visualStyle: 'Minimalist' };
  const creatorAesthetic = { keywords: ['Authentic', 'Vibrant', 'Candid'], tone: 'Witty', visualStyle: 'Cinematic Vlog' };

  // 2. Run AI Moodboard Generation
  const result = await aiClient.json(moodboardGeneratorPrompt({
    brandAesthetic,
    creatorAesthetic,
    campaignGoals: (concept.deliverable.deal.dealDraft?.notes as string) || 'Drive awareness.',
  })) as any;

  // 3. Save the new moodboard to the database
  const moodboard = await prisma.creativeMoodboard.upsert({
    where: { conceptId },
    create: {
      conceptId,
      brandAesthetic,
      creatorAesthetic,
      fusionAesthetic: result.fusionAesthetic,
      referenceImages: result.referenceImages,
      colorPalette: result.colorPalette,
      typography: result.typography,
      keywords: result.keywords,
      modelVersion: 'v1.0',
    },
    update: {
      brandAesthetic,
      creatorAesthetic,
      fusionAesthetic: result.fusionAesthetic,
      referenceImages: result.referenceImages,
      colorPalette: result.colorPalette,
      typography: result.typography,
      keywords: result.keywords,
      modelVersion: 'v1.0',
    },
  });

  console.log(`[AI MOODBOARD] Successfully generated moodboard for concept ${conceptId}.`);
  return moodboard;
}