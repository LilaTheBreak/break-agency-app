import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TagAssetInput {
  assetId: string;
  assetType: 'AssetGeneration' | 'CreativeConcept'; // Extend as needed
  content: any; // The actual content to be analyzed (e.g., caption text, script)
}

/**
 * Simulates a call to an AI client to extract tags from content.
 */
const aiClient = {
  extractTags: async (content: any) => {
    // Mock AI analysis of the content
    return {
      keywords: ['skincare', 'morning routine', 'self-care'],
      tone: ['aspirational', 'calm', 'informative'],
      categories: ['beauty', 'lifestyle'],
      aesthetic: ['minimalist', 'clean', 'natural light'],
      hookType: ['problem-solution', 'educational'],
      brandFitScore: 92.5,
      riskFlags: {
        claims: 'low',
        competitor_mention: 'none',
      },
      metadataVersion: '1.0',
    };
  },
};

/**
 * Gets the correct Prisma delegate based on the asset type string.
 */
const getPrismaModel = (assetType: string) => {
  switch (assetType) {
    case 'AssetGeneration':
      return prisma.assetGeneration;
    // Add other models here as they become taggable
    // case 'CreativeConcept':
    //   return prisma.creativeConcept;
    default:
      throw new Error(`Unsupported asset type for tagging: ${assetType}`);
  }
};

/**
 * Generates AI tags for a single creative asset and saves them to its metadata.
 * @param input The asset details.
 * @returns The updated asset.
 */
export const tagAsset = async (input: TagAssetInput) => {
  const { assetId, assetType, content } = input;

  const model = getPrismaModel(assetType);

  // 1. Fetch the asset to ensure it exists
  const asset = await (model as any).findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new Error(`${assetType} with ID ${assetId} not found.`);
  }

  // 2. Generate tags using the AI client
  const aiTags = await aiClient.extractTags(content);

  // 3. Merge new tags into the existing metadata
  const existingMetadata = (asset.metadata || {}) as object;
  const newMetadata = {
    ...existingMetadata,
    aiTags,
  };

  // 4. Update the asset in the database
  const updatedAsset = await (model as any).update({
    where: { id: assetId },
    data: { metadata: newMetadata },
  });

  return updatedAsset;
};