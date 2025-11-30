import prisma from '../../lib/prisma.js';
import { aiClient } from './aiClient.js';

const assetGeneratorPrompt = (context: {
  assetType: string;
  preferences: any;
  creatorPersona: any;
  briefSummary: string;
  dealContext: any;
}) => `
You are an AI Creative Asset Generator for a talent agency. Your task is to generate a specific creative asset based on a rich context bundle.

**Asset to Generate:** ${context.assetType}
**Creative Preferences:** ${JSON.stringify(context.preferences, null, 2)}
**Creator Persona:** ${JSON.stringify(context.creatorPersona, null, 2)}
**Campaign Brief Summary:** ${context.briefSummary}
**Deal Context:** ${JSON.stringify(context.dealContext, null, 2)}

**Instructions:**
Generate the requested creative asset in a structured JSON format.
- If 'script', provide a scene-by-scene script.
- If 'hooks', provide 5 distinct opening hooks.
- If 'talking_points', provide a bulleted list of key messages.
- If 'ctas', provide 3 clear calls-to-action.
- If 'thumbnail_ideas', describe 3 visual concepts for a thumbnail.

**JSON Output Schema:**
{
  "assetType": "${context.assetType}",
  "output": "string | [string] | [{...}]"
}
`;

/**
 * Checks if a user has permission to generate a specific asset type.
 * @param user - The user object, including roles.
 * @param assetType - The type of asset being requested.
 */
export function canGenerateAssets(user: any, assetType: string): boolean {
  const userRoles = user.roles?.map((r: any) => r.role.name) || [];

  const allowedRoles = ['super_admin', 'admin', 'exclusive_talent', 'talent', 'founder', 'brand_premium'];
  if (userRoles.some((role: string) => allowedRoles.includes(role))) {
    return true;
  }

  const limitedRoles = ['ugc'];
  if (userRoles.some((role: string) => limitedRoles.includes(role))) {
    return ['script', 'caption'].includes(assetType);
  }

  return false;
}

/**
 * The main orchestrator for the AI creative asset generation pipeline.
 * @param user - The user requesting the asset.
 * @param deliverableId - The ID of the deliverable to generate an asset for.
 * @param type - The type of asset to generate.
 * @param preferences - User-defined preferences for the generation.
 */
export async function generateCreativeAsset({ user, deliverableId, type, preferences }: { user: any; deliverableId: string; type: string; preferences: any }) {
  // 1. Role Gating
  if (!canGenerateAssets(user, type)) {
    throw new Error('User does not have permission to generate this asset type.');
  }

  // 2. Load Context
  const deliverable = await prisma.deliverableItem.findUnique({
    where: { id: deliverableId },
    include: {
      deal: { include: { dealDraft: true, user: { include: { personaProfile: true } } } },
    },
  });

  if (!deliverable || !deliverable.deal.user) {
    throw new Error('Deliverable context is incomplete for asset generation.');
  }

  const contextBundle = {
    assetType: type,
    preferences,
    creatorPersona: deliverable.deal.user.personaProfile || {},
    briefSummary: (deliverable.deal.dealDraft?.notes as string) || 'No brief summary available.',
    dealContext: {
      brand: deliverable.deal.brandName,
      deliverable: deliverable.type,
    },
  };

  // 3. Call the AI Engine
  const result = await aiClient.json(assetGeneratorPrompt(contextBundle)) as any;

  // 4. Store the AssetGeneration row
  const assetGeneration = await prisma.assetGeneration.create({
    data: {
      deliverableId,
      userId: user.id,
      type,
      inputContext: contextBundle,
      aiOutput: result,
    },
  });

  console.log(`[ASSET GENERATOR] Successfully generated asset of type '${type}' for deliverable ${deliverableId}.`);
  return assetGeneration;
}