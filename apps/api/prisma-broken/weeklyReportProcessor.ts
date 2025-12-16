import { Job } from 'bullmq';
import { generateWeeklyReport } from '../../services/ai/reports/weeklyReportEngine';
// import { generateReportPdf } from '../../services/ai/reports/pdfGenerator';
// import { fileService } from '../../services/fileService';
// import { emailQueue } from '../../queues/emailQueue';

interface WeeklyReportJobData {
  userId: string;
}

/**
 * Processes a weekly report generation job from the queue.
 */
export default async function weeklyReportProcessor(job: Job<WeeklyReportJobData>) {
  const { userId } = job.data;
  console.log(`Processing weekly report for userId: ${userId}`);

  try {
    // 1. Generate and save the report data
    const reportId = await generateWeeklyReport(userId);

    // 2. Generate PDF (stubbed)
    // const { pdfBuffer } = await generateReportPdf(reportId);

    // 3. Upload to S3 (stubbed)
    // const { url } = await fileService.upload(pdfBuffer, `reports/${userId}/${reportId}.pdf`);

    // 4. Email to user (stubbed)
    // await emailQueue.add('send-weekly-report', { userId, reportId, pdfUrl: url });
  } catch (error) {
    console.error(`Failed to process weekly report for userId: ${userId}`, error);
    throw error; // Allow BullMQ to handle retries
  }
}