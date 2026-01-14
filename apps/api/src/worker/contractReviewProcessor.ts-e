import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { runContractReviewEngine } from '../../services/ai/contracts/contractReviewEngine';
// import { fileService } from '../../services/fileService'; // Assume a service to get files from S3

const prisma = new PrismaClient();

interface ContractReviewJobData {
  contractReviewId: string;
  fileKey: string; // Key to retrieve the file from S3
}

/**
 * Processes a contract review job from the queue.
 */
export default async function contractReviewProcessor(job: Job<ContractReviewJobData>) {
  const { contractReviewId, fileKey } = job.data;
  console.log(`Processing contract review for ID: ${contractReviewId}`);

  try {
    // In a real app, you'd fetch the file from S3 using the fileKey
    // const pdfBuffer = await fileService.download(fileKey);
    const pdfBuffer = Buffer.from(''); // Placeholder

    await runContractReviewEngine(contractReviewId, pdfBuffer);
  } catch (error) {
    console.error(`Failed to process contract review job for ID: ${contractReviewId}`, error);
    throw error; // Allow BullMQ to handle retries
  }
}