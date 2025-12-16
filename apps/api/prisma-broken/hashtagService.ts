import { PrismaClient, DeliverableItem } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Simulates an AI client generating hashtag clusters based on content.
 */
const generateHashtagClusters = async (content: string) => {
  // Mock AI analysis
  return {
    brand: ['#brandname', '#brandcampaign'],
    niche: ['#skincare', '#selfcare', '#morningroutine'],
    trending: ['#fyp', '#viralvideo'],
    broad: ['#beauty', '#lifestyle'],
  };
};

/**
 * Simulates fetching trend data for a set of hashtags.
 */
const fetchTrendSignals = async (hashtags: string[]) => {
  const trendData = {};
  for (const tag of hashtags) {
    trendData[tag] = {
      velocity: Math.random() * 100,
      volume: Math.floor(Math.random() * 1000000),
    };
  }
  return trendData;
};

/**
 * Simulates ranking hashtags and assigning a difficulty score.
 */
const rankHashtags = (clusters: Record<string, string[]>) => {
  const difficultyMap = {};
  Object.values(clusters).flat().forEach(tag => {
    if (tag.includes('brand')) difficultyMap[tag] = 'low';
    else if (tag.includes('niche')) difficultyMap[tag] = 'medium';
    else difficultyMap[tag] = 'high';
  });
  return difficultyMap;
};

/**
 * Main orchestrator function to generate a full hashtag set for a deliverable.
 * @param deliverableId The ID of the deliverable.
 * @returns The newly created HashtagSet record.
 */
export const generateHashtagsForDeliverable = async (deliverableId: string) => {
  const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
  if (!deliverable) throw new Error('Deliverable not found.');

  const contentToAnalyze = deliverable.caption || '';

  // 1. Generate hashtag candidates and cluster them
  const clusters = await generateHashtagClusters(contentToAnalyze);

  // 2. Fetch trend signals
  const allTags = Object.values(clusters).flat();
  const trendData = await fetchTrendSignals(allTags);

  // 3. Score and rank hashtags
  const difficultyMap = rankHashtags(clusters);

  // 4. Save the new hashtag set
  const hashtagSet = await prisma.hashtagSet.create({
    data: {
      deliverableId,
      platform: deliverable.platform,
      clusters,
      difficultyMap,
      trendData,
    },
  });

  // 5. Mark the deliverable as having hashtags
  await prisma.deliverableItem.update({
    where: { id: deliverableId },
    data: { aiHashtags: true },
  });

  return hashtagSet;
};