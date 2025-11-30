import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { personaTrainingQueue } from '../worker/queues/personaQueues.js';

/**
 * Cron job to enqueue a weekly persona retraining for all active talents.
 */
async function weeklyPersonaRetraining() {
  console.log('[CRON] Enqueuing weekly persona retraining...');
  const activeTalents = await prisma.talent.findMany({
    where: { user: { status: 'active' } },
  });

  for (const talent of activeTalents) {
    await personaTrainingQueue.add('retrain-persona', { talentId: talent.id });
  }
}

cron.schedule('0 2 * * 1', weeklyPersonaRetraining); // Every Monday at 2 AM