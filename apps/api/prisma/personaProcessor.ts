import type { Job } from 'bullmq';
import prisma from '../../lib/prisma.js';
import { extractPersonaFromContent } from '../../services/ai/persona/personaExtractor.js';

/**
 * Worker to generate an AI persona for a creator.
 */
export default async function personaProcessor(job: Job<{ talentId: string }>) {
  const { talentId } = job.data;
  console.log(`[WORKER] Generating persona for talent: ${talentId}`);

  // 1. Extract Content Samples
  const talent = await prisma.talent.findUnique({ where: { id: talentId }, include: { user: { include: { socialPosts: { take: 10, orderBy: { postedAt: 'desc' } } } } } });
  if (!talent) throw new Error('Talent not found.');

  const contentSamples = talent.user.socialPosts.map(p => p.caption || '').filter(Boolean);
  if (contentSamples.length < 3) {
    console.warn(`Not enough content samples for talent ${talentId}. Skipping persona generation.`);
    return;
  }

  // 2. Synthesize Persona
  const persona = await extractPersonaFromContent(contentSamples) as any;

  // 3. Save Persona
  await prisma.creatorPersonaProfile.upsert({
    where: { userId: talent.userId },
    create: {
      userId: talent.userId,
      ...persona,
    },
    update: {
      ...persona,
    },
  });
}