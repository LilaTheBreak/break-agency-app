import prisma from '../../lib/prisma.js';
import { generateDeckSlides } from './deckTemplate.js';
import { renderDeck } from './deckRenderer.js';

/**
 * Orchestrates the entire deck generation process for a campaign plan.
 * @param aiPlanId - The ID of the CampaignAIPlan.
 */
export async function generateCampaignDeck(aiPlanId: string) {
  // 1. Load the AI plan
  const plan = await prisma.campaignAIPlan.findUnique({ where: { id: aiPlanId } });
  if (!plan) throw new Error('Campaign AI Plan not found.');

  // 2. Generate the slide content from a template
  const jsonSlides = generateDeckSlides(plan);

  // 3. Render the slides into PDF and PPTX (stubbed)
  const { pdfUrl, pptxUrl } = await renderDeck(jsonSlides);

  // 4. Save the generated deck to the database
  const deck = await prisma.campaignDeck.upsert({
    where: { aiPlanId },
    create: {
      aiPlanId,
      pdfUrl,
      pptxUrl,
      jsonSlides,
    },
    update: {
      pdfUrl,
      pptxUrl,
      jsonSlides,
    },
  });

  console.log(`[DECK GENERATOR] Successfully generated deck ${deck.id} for plan ${aiPlanId}.`);
  return deck;
}