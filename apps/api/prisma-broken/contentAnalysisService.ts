import { PrismaClient } from '@prisma/client';
import { SocialPlatform } from '../src/types/socialPlatform.js';
import { rewriteCaption } from './captionRewriter';
import { scoreHook } from './hookScorer';
import { analyzeThumbnail } from './thumbnailAnalyzer';
import { predictPerformance } from './performancePredictor';

const prisma = new PrismaClient();

interface ContentInput {
  userId: string;
  platform: SocialPlatform;
  caption?: string;
  hook?: string;
  thumbnailUrl?: string;
}

/**
 * Orchestrates a full content analysis by calling individual AI services.
 * @param input The content to be analyzed.
 * @returns The ID of the newly created ContentAnalysis record.
 */
export const analyzeContent = async (input: ContentInput): Promise<string> => {
  const { userId, platform, caption, hook, thumbnailUrl } = input;

  // Run all analyses in parallel
  const [hookResult, captionResult, thumbnailResult, performanceResult] = await Promise.all([
    hook ? scoreHook(hook) : Promise.resolve(null),
    caption ? rewriteCaption(caption, platform) : Promise.resolve(null),
    thumbnailUrl ? analyzeThumbnail(thumbnailUrl) : Promise.resolve(null),
    predictPerformance({ caption, hook }),
  ]);

  const analysis = await prisma.contentAnalysis.create({
    data: {
      userId,
      platform,
      caption,
      hook,
      thumbnailUrl,
      aiScores: {
        hookScore: hookResult?.score,
        thumbnailGrade: thumbnailResult?.grade,
      },
      aiFixes: {
        rewrittenCaptions: captionResult?.variants,
        thumbnailSuggestions: thumbnailResult?.suggestions,
        hookSuggestions: hookResult?.suggestions,
      },
      postPredictions: {
        ...performanceResult,
      },
      aiSummary: {
        overall: `This post has a predicted virality score of ${performanceResult.viralityScore}. The main strengths are its hook and relevance. The thumbnail could be improved for better CTR.`,
      },
    },
  });

  return analysis.id;
};
