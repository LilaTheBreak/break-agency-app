import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchFilters {
  keyword?: string;
  talentId?: string;
  brandName?: string;
  platform?: string;
  assetType?: string;
  campaignId?: string;
  status?: string;
}

/**
 * Searches for creative assets across multiple models based on filters.
 * This is a simplified version. A production implementation would require
 * a more robust search strategy, possibly using a dedicated search index
 * like Elasticsearch or Algolia.
 * @param user The user performing the search.
 * @param filters The search criteria.
 * @returns A unified list of creative assets.
 */
export const searchCreativeAssets = async (user: User, filters: SearchFilters) => {
  const { keyword, talentId, brandName, platform, assetType, campaignId } = filters;

  // Permission-based where clause
  const permissionWhere: any = {};
  if (user.role === 'BRAND_FREE' || user.role === 'UGC_CREATOR') {
    // Restrict to assets they own/created
    permissionWhere.userId = user.id;
  }

  // 1. Search AssetGeneration records (the most common source)
  const assetGenerations = await prisma.assetGeneration.findMany({
    where: {
      ...permissionWhere,
      userId: talentId,
      deliverable: {
        deal: {
          brandName: brandName ? { contains: brandName, mode: 'insensitive' } : undefined,
          campaign: campaignId ? { id: campaignId } : undefined,
        },
      },
      // Basic keyword search on the JSON output
      aiOutput: keyword ? { path: ['captions', 'short'], string_contains: keyword } : undefined,
    },
    include: {
      user: { select: { name: true } },
      deliverable: { include: { deal: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // 2. Unify results into a common format
  const unifiedAssets = assetGenerations.map(asset => {
    const aiOutput = asset.aiOutput as any;
    return {
      id: asset.id,
      type: 'Generated Asset',
      preview: aiOutput?.captions?.short || aiOutput?.hooks?.[0] || 'No preview available',
      platform: asset.deliverable.platform,
      talent: asset.user.name,
      brand: asset.deliverable.deal?.brandName,
      dealId: asset.deliverable.dealId,
      campaignId: asset.deliverable.deal?.campaignId,
      createdAt: asset.createdAt,
      updatedAt: asset.deliverable.updatedAt,
      versionCount: 1, // This would require a more complex query to count versions
      locked: asset.deliverable.locked,
      // Add a link back to the deliverable for the editor
      deliverableId: asset.deliverableId,
    };
  });

  // In a real app, you would query other models like CreativeConcept,
  // CreativeCaption, etc., and merge the results here.

  return unifiedAssets;
};

/**
 * Simulates re-ranking search results for relevance using an AI model.
 * @param results The initial search results.
 * @param query The original search query for context.
 * @returns The re-ranked list of results.
 */
export const rankSearchResults = async (results: any[], query: string) => {
  // Mock AI logic: just reverse the order for demonstration
  return results.reverse();
};