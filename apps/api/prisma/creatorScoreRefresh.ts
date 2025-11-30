import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { scoreCreator } from '../services/scoring/creatorScoringEngine.js';

/**
 * A nightly cron job to re-evaluate the scores of all active creators.
 */
async function reScoreAllCreators() {
  console.log('[CRON] Starting nightly creator re-scoring job...');
  const activeCreators = await prisma.user.findMany({
    where: {
      // Define what an "active" creator is, e.g., has linked socials and is not disabled.
      status: 'active',
      roster_category: { not: 'none' },
    },
  });

  for (const creator of activeCreators) await scoreCreator(creator.id);
}

cron.schedule('0 2 * * *', reScoreAllCreators); // Runs every day at 2:00 AM