import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const captionGeneratorPrompt = (context: {
  platform: string;
  conceptName: string;
  scriptOutline: string[];
  creatorPersona: any;
}) => `
You are an AI social media copywriter and viral strategist. Your task is to generate a complete set of captions and related assets for a creative concept on a specific platform.

**Creative Context:**
- **Concept:** ${context.conceptName}
- **Platform:** ${context.platform}
- **Creator Persona:** ${JSON.stringify(context.creatorPersona, null, 2)}
- **Script Outline:** ${context.scriptOutline.join(', ')}

**Instructions:**
Generate a comprehensive, structured JSON output for the caption assets.
1.  **primaryCaption**: Write the best, most engaging caption for the video.
2.  **variants**: Write 2-3 alternative captions with different angles or tones.
3.  **ctas**: Suggest 2 clear, compelling calls-to-action.
4.  **seoKeywords**: List 5-7 SEO-friendly keywords relevant to the content.
5.  **hashtags**: Provide 3 sets of hashtags: short (3-5), medium (10-15), and long (20-25).
6.  **soundSuggestions**: Suggest 2-3 currently trending sounds or audio clips on ${context.platform} that would fit this video.
7.  **tone**: Describe the tone of the primary caption in 1-2 words.
8.  **score**: Provide an overall score (0-100) for the primary caption's potential success.

**JSON Output Schema:**
{
  "primaryCaption": "string",
  "variants": ["string"],
  "ctas": ["string"],
  "seoKeywords": ["string"],
  "hashtags": { "short": ["string"], "medium": ["string"], "long": ["string"] },
  "soundSuggestions": [{ "name": "string", "artist": "string" }],
  "tone": "string",
  "score": "number"
}
`;

/**
 * The main orchestrator for the AI caption generation pipeline.
 * @param conceptId - The ID of the CreativeConcept to generate captions for.
 * @param platform - The target platform.
 */
export async function generateCaptions(conceptId: string, platform: string) {
  // 1. Load Context
  const concept = await prisma.creativeConcept.findUnique({
    where: { id: conceptId },
    include: { deliverable: { include: { deal: { include: { user: { include: { personaProfile: true } } } } } } },
  });

  if (!concept || !concept.deliverable.deal.user) {
    throw new Error('Creative concept or its context not found.');
  }

  // 2. Run AI Caption Generation
  const result = await aiClient.json(captionGeneratorPrompt({
    platform,
    conceptName: concept.conceptName || 'Untitled Concept',
    scriptOutline: (concept.scriptOutline as string[]) || [],
    creatorPersona: concept.deliverable.deal.user.personaProfile || { toneKeywords: 'friendly' },
  })) as any;

  // 3. Save the new caption set to the database
  const caption = await prisma.creativeCaption.create({
    data: {
      conceptId,
      platform,
      primaryCaption: result.primaryCaption,
      variants: result.variants,
      ctas: result.ctas,
      seoKeywords: result.seoKeywords,
      hashtags: result.hashtags,
      soundSuggestions: result.soundSuggestions,
      tone: result.tone,
      score: result.score,
      modelVersion: 'v1.0',
    },
  });

  console.log(`[AI CAPTIONER] Successfully generated captions for concept ${conceptId} on ${platform}.`);
  return caption;
}