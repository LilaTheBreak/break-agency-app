import prisma from '../../lib/prisma.js';
import { aiClient } from '../ai/aiClient.js';
import { generateBriefPdf } from './pdf/creativeBriefPdf.js';
import { createAssetZip } from './zipper.js';

const scriptPrompt = (context: any) => `
You are a creative director. Based on the campaign brief, write 3 distinct script ideas for the creator.

**Campaign Brief:**
${JSON.stringify(context.brief, null, 2)}

**JSON Output Schema:**
{ "scripts": [{ "title": "string", "concept": "string", "dialogue_hook": "string" }] }
`;

/**
 * Orchestrates the creation of a full talent asset pack.
 * @param aiPlanId - The ID of the campaign plan.
 * @param talentId - The ID of the talent for whom to build the pack.
 */
export async function buildAssetPack(aiPlanId: string, talentId: string) {
  // 1. Load context
  const plan = await prisma.campaignAIPlan.findUnique({ where: { id: aiPlanId } });
  const contract = await prisma.aIContractDraft.findFirst({ where: { aiPlanId, talentId } });

  if (!plan || !contract) throw new Error('Plan or contract not found for this asset pack.');

  // 2. Generate assets
  const briefPdf = await generateBriefPdf(plan);
  // Stubs for other PDFs
  const guidelinesPdf = `https://stub-s3.local/assets/brand-guidelines.pdf`;
  const usageRightsPdf = `https://stub-s3.local/assets/usage-rights.pdf`;

  // 3. Generate scripts and captions with AI
  const { scripts } = await aiClient.json(scriptPrompt({ brief: plan.strategy })) as any;
  const { captions } = await aiClient.json(`Generate 3 captions for a post about ${plan.brandName}. Respond with JSON: { "captions": ["string"] }`) as any;

  // 4. Create ZIP file (stubbed)
  const zipUrl = await createAssetZip([
    { url: briefPdf, name: 'Creative_Brief.pdf' },
    { url: guidelinesPdf, name: 'Brand_Guidelines.pdf' },
  ]);

  // 5. Save the TalentAssetPack entry
  const assetPack = await prisma.talentAssetPack.create({
    data: {
      aiPlanId,
      talentId,
      brandName: plan.brandName!,
      zipUrl,
      briefPdf,
      guidelinesPdf,
      usageRightsPdf,
      scriptsJson: scripts,
      captionsJson: captions,
      status: 'completed',
    },
  });

  console.log(`[ASSET BUILDER] Successfully created asset pack ${assetPack.id} for talent ${talentId}`);
  return assetPack;
}