/**
 * Enrichment Job Queue Service
 * 
 * Background job processing for contact enrichment
 * Uses BullMQ for reliable, scalable job processing
 * Supports retries, priority, and failure tracking
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'redis';
import { logError } from '../../lib/logger.js';
import prisma from '../../lib/prisma.js';
import { enrichmentOrchestrator } from './enrichmentOrchestrator.js';

// Redis connection (configured via environment)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  logError('[ENRICHMENT QUEUE] Redis connection error:', err);
});

// BullMQ Queue for enrichment jobs
export const enrichmentQueue = new Queue('enrichment', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Queue events for monitoring
const queueEvents = new QueueEvents('enrichment', { connection: redis });

queueEvents.on('completed', ({ jobId }) => {
  console.log(`[ENRICHMENT QUEUE] Job ${jobId} completed successfully`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`[ENRICHMENT QUEUE] Job ${jobId} failed: ${failedReason}`);
});

// Worker to process enrichment jobs
export const enrichmentWorker = new Worker(
  'enrichment',
  async (job) => {
    try {
      const { jobType, brandId, brandName, linkedInCompanyUrl, userId, regionCode } = job.data;

      console.log(`[ENRICHMENT QUEUE] Processing job ${job.id}: ${jobType}`);

      // Update job status to RUNNING
      const dbJob = await prisma.enrichmentJob.update({
        where: { id: jobType === 'discover' ? brandId : job.id },
        data: { status: 'running', startedAt: new Date() },
      });

      // Process based on job type
      let result;
      if (jobType === 'discover') {
        result = await enrichmentOrchestrator.startEnrichmentJob({
          brandName,
          linkedInCompanyUrl,
          brandId,
          regionCode,
          userId,
        });
      } else if (jobType === 'enrich_emails') {
        result = await enrichmentOrchestrator.enrichEmails(brandId);
      } else if (jobType === 'validate_compliance') {
        result = await enrichmentOrchestrator.validateCompliance(brandId, regionCode);
      }

      // Update job status to COMPLETE
      await prisma.enrichmentJob.update({
        where: { id: dbJob.id },
        data: {
          status: 'complete',
          completedAt: new Date(),
          contactsEnriched: result?.contactsEnriched || 0,
        },
      });

      return result;
    } catch (error) {
      logError('[ENRICHMENT QUEUE] Job processing failed:', error);

      // Update job status to FAILED
      try {
        const { jobType, brandId } = job.data;
        await prisma.enrichmentJob.update({
          where: { id: brandId },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorCode: 'JOB_PROCESSING_ERROR',
            completedAt: new Date(),
          },
        });
      } catch (updateError) {
        logError('[ENRICHMENT QUEUE] Could not update job status:', updateError);
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process max 5 jobs simultaneously
  }
);

enrichmentWorker.on('error', (err) => {
  logError('[ENRICHMENT QUEUE] Worker error:', err);
});

/**
 * Enqueue a new enrichment discovery job
 */
export async function enqueueDiscoveryJob(jobData: {
  brandId: string;
  brandName: string;
  brandWebsite?: string;
  linkedInCompanyUrl?: string;
  userId: string;
  regionCode?: string;
}): Promise<string> {
  try {
    const job = await enrichmentQueue.add(
      'discover',
      {
        jobType: 'discover',
        ...jobData,
      },
      {
        priority: 1,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    console.log(`[ENRICHMENT QUEUE] Enqueued discovery job ${job.id} for ${jobData.brandName}`);
    return job.id;
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Failed to enqueue discovery job:', error);
    throw error;
  }
}

/**
 * Enqueue an email enrichment job
 */
export async function enqueueEmailEnrichmentJob(brandId: string): Promise<string> {
  try {
    const job = await enrichmentQueue.add(
      'enrich_emails',
      {
        jobType: 'enrich_emails',
        brandId,
      },
      {
        priority: 2,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    console.log(`[ENRICHMENT QUEUE] Enqueued email enrichment job ${job.id} for brand ${brandId}`);
    return job.id;
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Failed to enqueue email enrichment job:', error);
    throw error;
  }
}

/**
 * Enqueue a compliance validation job
 */
export async function enqueueComplianceCheckJob(
  brandId: string,
  regionCode?: string
): Promise<string> {
  try {
    const job = await enrichmentQueue.add(
      'validate_compliance',
      {
        jobType: 'validate_compliance',
        brandId,
        regionCode,
      },
      {
        priority: 3,
        attempts: 2,
      }
    );

    console.log(`[ENRICHMENT QUEUE] Enqueued compliance check job ${job.id} for brand ${brandId}`);
    return job.id;
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Failed to enqueue compliance check job:', error);
    throw error;
  }
}

/**
 * Get job status by ID
 */
export async function getJobStatus(jobId: string) {
  try {
    const job = await enrichmentQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const progress = job._progress;

    return {
      id: job.id,
      state,
      progress,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    };
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Error getting job status:', error);
    return null;
  }
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string) {
  try {
    const job = await enrichmentQueue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.retry();
    console.log(`[ENRICHMENT QUEUE] Retrying job ${jobId}`);
    return { success: true, jobId };
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Error retrying job:', error);
    throw error;
  }
}

/**
 * Cancel a job
 */
export async function cancelJob(jobId: string) {
  try {
    const job = await enrichmentQueue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    console.log(`[ENRICHMENT QUEUE] Cancelled job ${jobId}`);
    return { success: true, jobId };
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Error cancelling job:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const counts = await enrichmentQueue.getJobCounts(
      'active',
      'completed',
      'failed',
      'delayed',
      'waiting'
    );

    return {
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      waiting: counts.waiting || 0,
      total: (counts.active || 0) + (counts.waiting || 0) + (counts.delayed || 0),
    };
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Error getting queue stats:', error);
    return {
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      waiting: 0,
      total: 0,
    };
  }
}

/**
 * Clean up completed jobs older than specified days
 */
export async function cleanupOldJobs(daysOld: number = 7) {
  try {
    const timestamp = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    const removed = await enrichmentQueue.clean(timestamp, 10000, 'completed');
    console.log(`[ENRICHMENT QUEUE] Cleaned up ${removed.length} old completed jobs`);
    return removed;
  } catch (error) {
    logError('[ENRICHMENT QUEUE] Error cleaning up jobs:', error);
    return [];
  }
}

export default {
  enrichmentQueue,
  enqueueDiscoveryJob,
  enqueueEmailEnrichmentJob,
  enqueueComplianceCheckJob,
  getJobStatus,
  retryJob,
  cancelJob,
  getQueueStats,
  cleanupOldJobs,
};
