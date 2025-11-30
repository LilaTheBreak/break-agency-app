import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const contentPlanPrompt = (context: {
  conceptName: string;
  conceptDescription: string;
  platform: string;
  creatorPersona: any;
  brandGuidelines: any;
}) => `
You are an AI Content Strategist and Producer. Your task is to take a creative concept and build a complete, actionable content plan for a creator.

**Creative Concept:**
- **Name:** ${context.conceptName}
- **Description:** ${context.conceptDescription}
- **Platform:** ${context.platform}

**Creator Persona:**
${JSON.stringify(context.creatorPersona, null, 2)}

**Brand Guidelines:**
${JSON.stringify(context.brandGuidelines, null, 2)}

**Instructions:**
Generate a comprehensive, structured JSON content plan.
1.  **suggestPostingDates**: Suggest 3 optimal posting dates and times within the next two weeks. Provide a reason for each.
2.  **improveScript**: Based on the concept, write a short, engaging script for the video.
3.  **generateEditInstructions**: Provide 3-5 simple editing notes for a video editor (e.g., "Use fast cuts in the first 3 seconds," "Add trending background music").
4.  **generateCaptionIdeas**: Write 3 distinct caption ideas that match the creator's persona and include a clear call-to-action.
5.  **checkBrandGuidelines**: List any brand guideline checks that passed or failed (e.g., "Passed: Included #ad", "Failed: Used a forbidden word").

**JSON Output Schema:**
{
  "postingDates": [
    { "date": "ISO_8601_DateTime", "reason": "string" }
  ],
  "script": "string",
  "editInstructions": ["string"],
  "captionIdeas": ["string"],
  "brandGuidelineCheck": { "passed": ["string"], "failed": ["string"] }
}
`;

/**
 * The main orchestrator for the AI content planning pipeline.
 * @param conceptId - The ID of the CreativeConcept to build a plan from.
 */
export async function autoBuildContentPlan(conceptId: string) {
  // 1. Load Context
  const concept = await prisma.creativeConcept.findUnique({
    where: { id: conceptId },
    include: { deliverable: { include: { deal: { include: { user: { include: { personaProfile: true, talents: true } }, dealDraft: true } } } } },
  });

  if (!concept || !concept.deliverable.deal.user || !concept.deliverable.deal.user.talents[0]) {
    throw new Error('Concept context is incomplete for content planning.');
  }

  const talent = concept.deliverable.deal.user.talents[0];

  // 2. Run AI Plan Generation
  const result = await aiClient.json(contentPlanPrompt({
    conceptName: concept.conceptName || 'Untitled Concept',
    conceptDescription: concept.conceptDescription || '',
    platform: concept.platform,
    creatorPersona: concept.deliverable.deal.user.personaProfile || {},
    brandGuidelines: (concept.deliverable.deal.dealDraft?.notes as any) || {},
  })) as any;

  // 3. Create the ContentItem and first ContentVersion
  const contentItem = await prisma.contentItem.create({
    data: {
      talentId: talent.id,
      conceptId: concept.id,
      platform: concept.platform,
      title: concept.conceptName || 'Untitled Content',
      description: concept.conceptDescription,
      status: 'draft',
      scheduledFor: new Date(result.postingDates[0].date), // Use the first suggested date
    },
  });

  await prisma.contentVersion.create({
    data: {
      contentItemId: contentItem.id,
      versionNumber: 1,
      script: result.script,
      caption: result.captionIdeas[0], // Use the first caption idea
      aiSuggestions: {
        captionIdeas: result.captionIdeas,
        postingDates: result.postingDates,
      },
      aiEditInstructions: result.editInstructions,
    },
  });

  console.log(`[AI CONTENT PLANNER] Successfully generated plan for concept ${conceptId}. ContentItem ID: ${contentItem.id}`);
  return contentItem;
}