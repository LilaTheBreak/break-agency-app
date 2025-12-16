import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { contractAssembleQueue } from '../worker/queues/contractWriterQueues.js';

/**
 * Cron job to find finalized deals that need a contract.
 */
async function contractAutoGenerate() {
  console.log('[CRON] Checking for deals needing contract generation...');
  const dealsToContract = await prisma.dealDraft.findMany({
    where: { status: 'won', generatedContract: null },
  });

  for (const draft of dealsToContract) {
    await contractAssembleQueue.add('auto-generate-contract', { dealDraftId: draft.id });
  }
}

// Schedule to run every hour
cron.schedule('0 * * * *', contractAutoGenerate);