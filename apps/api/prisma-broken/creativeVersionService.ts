import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateVersionInput {
  assetId: string;
  assetType: string;
  content: any;
  metadata?: any;
  userId: string;
}

/**
 * Simulates an AI call to generate a summary of changes between two content versions.
 */
const generateAIDiff = async (oldContent: any, newContent: any): Promise<any> => {
  // Mock AI analysis
  const changes = [];
  if (JSON.stringify(oldContent.captions) !== JSON.stringify(newContent.captions)) {
    changes.push('Updated captions with a more direct call-to-action.');
  }
  if (JSON.stringify(oldContent.hooks) !== JSON.stringify(newContent.hooks)) {
    changes.push('Refined hooks to be more engaging for a younger audience.');
  }
  if (changes.length === 0) {
    changes.push('Minor text edits and formatting changes.');
  }
  return { summary: changes.join(' ') };
};

/**
 * Creates a new version for a creative asset.
 * @param input The details of the new version.
 * @returns The newly created CreativeVersion.
 */
export const createVersion = async (input: CreateVersionInput) => {
  const { assetId, assetType, content, metadata, userId } = input;

  // 1. Find the latest version to increment the number and get old content for diffing
  const latestVersion = await prisma.creativeVersion.findFirst({
    where: { assetId, assetType },
    orderBy: { version: 'desc' },
  });

  const newVersionNumber = (latestVersion?.version || 0) + 1;

  // 2. Generate AI summary of changes
  const changesAI = latestVersion
    ? await generateAIDiff(latestVersion.content, content)
    : { summary: 'Initial version created.' };

  // 3. Create the new version record
  const newVersion = await prisma.creativeVersion.create({
    data: {
      assetId,
      assetType,
      version: newVersionNumber,
      content,
      metadata,
      changesAI,
      createdById: userId,
    },
  });

  return newVersion;
};

/**
 * Rolls back an asset to a specific version by creating a new version with the old content.
 * @param assetId The ID of the asset to roll back.
 * @param version The version number to roll back to.
 * @param userId The ID of the user performing the rollback.
 * @returns The new version record that represents the rolled-back state.
 */
export const rollbackToVersion = async (assetId: string, version: number, userId: string) => {
  const targetVersion = await prisma.creativeVersion.findFirst({
    where: { assetId, version },
  });

  if (!targetVersion) {
    throw new Error(`Version ${version} for asset ${assetId} not found.`);
  }

  // Create a new version using the content and metadata of the target version
  return createVersion({
    assetId: targetVersion.assetId,
    assetType: targetVersion.assetType,
    content: targetVersion.content,
    metadata: targetVersion.metadata,
    userId,
  });
};