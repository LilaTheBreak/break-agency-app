import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { generateFullCreativePackage, saveCreativeOutput } from '../../services/ai/creativeConceptService';

const prisma = new PrismaClient();

interface CreativeConceptJobData {
  deliverableId: string;
  userId: string;
}

/**
 * Worker processor that generates a full creative package for a deliverable.
 */
export default async function creativeConceptWorker(job: Job<CreativeConceptJobData>) {
  const { deliverableId, userId } = job.data;
  console.log(`Running Creative Concept Worker for deliverable: ${deliverableId}`);

  try {
    const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
    if (!deliverable) throw new Error('Deliverable not found.');

    // 1. Generate all creative assets
    const creativePackage = await generateFullCreativePackage(deliverable);

    // 2. Save the output
    await saveCreativeOutput(deliverableId, userId, creativePackage);

    console.log(`Successfully generated creative package for deliverable ${deliverableId}`);
  } catch (error) {
    console.error(`Creative Concept Worker failed for deliverable ${deliverableId}:`, error);
    throw error;
  }
}