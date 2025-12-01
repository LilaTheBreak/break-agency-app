import { PrismaClient } from '@prisma/client';
import { analyzeBrandTone } from './toneAnalysisService';
import { generateStrategyPaths } from './strategyPathGenerator';

const prisma = new PrismaClient();

interface AnalysisInput {
  userId: string;
  emailBody: string;
  brandEmail: string;
  offerDetails: any; // Simplified for mock
}

/**
 * Main orchestrator for the negotiation analysis pipeline.
 * @param input The data required for the analysis.
 * @returns The newly created NegotiationSession with all its related data.
 */
export const runNegotiationAnalysis = async (input: AnalysisInput) => {
  const { userId, emailBody, brandEmail, offerDetails } = input;

  // 1. Analyze Brand Tone
  const toneProfileData = await analyzeBrandTone(brandEmail, emailBody);

  // 2. Create the main session
  const session = await prisma.negotiationSession.create({
    data: {
      userId,
      brandName: 'Brand from Email', // Extract from email
      brandEmail,
      offerDetails,
      status: 'analyzed',
    },
  });

  // 3. Generate Strategy Paths
  const strategyPathsData = await generateStrategyPaths(offerDetails);

  // 4. Save all artifacts to the database in parallel
  await Promise.all([
    // Upsert tone profile
    prisma.negotiationToneProfile.upsert({
      where: { brandEmail },
      create: { brandEmail, sessionId: session.id, ...toneProfileData },
      update: { sessionId: session.id, ...toneProfileData },
    }),
    // Create strategy paths
    prisma.negotiationStrategyPath.createMany({
      data: strategyPathsData.map(path => ({
        sessionId: session.id,
        ...path,
      })),
    }),
  ]);

  // 5. Return the complete session object
  return await prisma.negotiationSession.findUnique({
    where: { id: session.id },
    include: { strategyPaths: true, toneProfiles: true },
  });
};