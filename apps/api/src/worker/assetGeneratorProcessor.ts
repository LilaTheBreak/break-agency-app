import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { generateAssets } from '../../services/ai/assetGenerator.js';

const prisma = new PrismaClient();

interface AssetGenerationJobData {
  deliverableId: string;
  userId: string;
}

/**
 * Processes an asset generation job from the queue.
 */
export default async function assetGeneratorProcessor(job: Job<AssetGenerationJobData>) {
  const { deliverableId, userId } = job.data;
  console.log(`Processing asset generation for deliverable ID: ${deliverableId}`);

  try {
    const deliverable = await prisma.deliverableItem.findUnique({ where: { id: deliverableId } });
    if (!deliverable) throw new Error('Deliverable not found.');

    // In a real app, you'd fetch brand guidelines and creator persona here
    const inputContext = {
      deliverableId,
      platform: deliverable.platform,
      tone: 'Authentic',
      brandGuidelines: {},
      creatorPersona: { style: 'minimalist' },
    };

    const assets = await generateAssets(inputContext);

    // Save the generated assets
    await prisma.assetGeneration.create({
      data: {
        deliverableId,
        userId,
        type: 'initial_concepts',
        aiOutput: assets,
      },
    });

    console.log(`Successfully generated assets for deliverable ${deliverableId}`);
  } catch (error) {
    console.error(`Failed to process asset generation for deliverable ${deliverableId}:`, error);
    throw error; // Allow BullMQ to handle retries
  }
}