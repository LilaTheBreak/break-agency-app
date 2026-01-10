import cron from "node-cron";
import { Resend } from "resend";
import prisma from "../lib/prisma.js";
import { logError, logInfo } from "../lib/logger.js";

const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "console@thebreak.co";

// Lazy-initialize Resend client only when needed
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient && resendApiKey) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient as Resend;
}

let cronJobs: Map<string, any> = new Map();

/**
 * Initialize scheduled export jobs
 * Run this on server startup
 */
export async function initializeScheduledExports() {
  console.log("[SCHEDULED_EXPORTS] Initializing scheduled export jobs");

  try {
    // Get all enabled export schedules
    const schedules = await prisma.exportSchedule.findMany({
      where: { enabled: true },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    let activeSchedules = 0;

    for (const schedule of schedules) {
      await scheduleExportJob(schedule.talentId, schedule);
      activeSchedules++;
    }

    console.log(`[SCHEDULED_EXPORTS] Initialized ${activeSchedules} active export schedules`);
  } catch (error) {
    console.error("[SCHEDULED_EXPORTS] Failed to initialize:", error);
    logError("Failed to initialize scheduled exports", error);
  }
}

/**
 * Schedule an export job for a specific talent
 */
async function scheduleExportJob(talentId: string, schedule: any) {
  const jobId = `export_${talentId}`;

  // Stop existing job if any
  if (cronJobs.has(jobId)) {
    const existingJob = cronJobs.get(jobId);
    if (existingJob) {
      existingJob.stop();
      cronJobs.delete(jobId);
    }
  }

  if (!schedule.enabled) {
    return;
  }

  // Determine cron schedule
  let cronExpression: string;

  if (schedule.frequency === "daily") {
    // Run daily at 9 AM UTC
    cronExpression = "0 9 * * *";
  } else if (schedule.frequency === "weekly") {
    // Run weekly on specified day at 9 AM UTC
    const dayOfWeek = schedule.dayOfWeek ?? 1; // Default to Monday
    cronExpression = `0 9 * * ${dayOfWeek}`;
  } else {
    console.warn(`[SCHEDULED_EXPORTS] Unknown frequency: ${schedule.frequency}`);
    return;
  }

  try {
    const job = cron.schedule(cronExpression, async () => {
      await executeExportJob(talentId, schedule);
    });

    cronJobs.set(jobId, job);
    console.log(`[SCHEDULED_EXPORTS] Scheduled ${jobId} with expression: ${cronExpression}`);
  } catch (error) {
    console.error(`[SCHEDULED_EXPORTS] Failed to schedule job ${jobId}:`, error);
  }
}

/**
 * Execute the export job - fetch data and send email
 */
async function executeExportJob(talentId: string, schedule: any) {
  try {
    console.log(`[SCHEDULED_EXPORT_JOB] Executing export for talent ${talentId}`);

    if (!schedule.email) {
      throw new Error("No email configured for export");
    }

    // Fetch closed deals
    const closedDeals = await prisma.deal.findMany({
      where: {
        talentId,
        stage: {
          in: ["COMPLETED", "LOST"],
        },
      },
      select: {
        id: true,
        brandName: true,
        value: true,
        currency: true,
        paymentStatus: true,
        closedAt: true,
        stage: true,
        campaignName: true,
        notes: true,
      },
      orderBy: { closedAt: "desc" },
    });

    console.log(
      `[SCHEDULED_EXPORT_JOB] Found ${closedDeals.length} closed deals for export`
    );

    // Get talent info
    const talent = await prisma.talent.findUnique({
      where: { id: talentId },
      select: { id: true, name: true },
    });

    if (!talent) {
      throw new Error(`Talent ${talentId} not found`);
    }

    // Generate CSV for email
    const csvContent = generateCSVForEmail(closedDeals);

    // Generate summary stats
    const stats = {
      totalDeals: closedDeals.length,
      wonDeals: closedDeals.filter((d) => d.stage === "COMPLETED").length,
      lostDeals: closedDeals.filter((d) => d.stage === "LOST").length,
      totalValue: closedDeals.reduce((sum, d) => sum + (d.value || 0), 0),
      paidValue: closedDeals
        .filter((d) => d.paymentStatus === "PAID")
        .reduce((sum, d) => sum + (d.value || 0), 0),
    };

    // Send email with HTML and attachment
    const htmlContent = generateEmailHTML(talent.name || talent.id, stats);

    const client = getResendClient();
    if (!resendApiKey) {
      console.warn("[SCHEDULED_EXPORTS] Skipping email send - RESEND_API_KEY not configured");
      return;
    }

    await client.emails.send({
      from: emailFrom,
      to: schedule.email,
      subject: `Closed Deals Report - ${talent.name || "Your Talent"} [${new Date().toLocaleDateString()}]`,
      html: htmlContent,
      attachments: [
        {
          filename: `closed-deals-${talentId}-${new Date().toISOString().split("T")[0]}.csv`,
          content: Buffer.from(csvContent).toString("base64"),
        },
      ],
    });

    // Update last export time
    await prisma.exportSchedule.update({
      where: { id: schedule.id },
      data: {
        lastExportAt: new Date(),
      },
    });

    console.log(`[SCHEDULED_EXPORT_JOB] Successfully sent export email to ${schedule.email}`);
    logInfo("Scheduled export sent", {
      talentId,
      email: schedule.email,
      dealCount: closedDeals.length,
    });
  } catch (error) {
    console.error(`[SCHEDULED_EXPORT_JOB] Failed to execute export for ${talentId}:`, error);
    logError(`Failed to execute scheduled export for ${talentId}`, error);
  }
}

/**
 * Generate CSV content for email attachment
 */
function generateCSVForEmail(
  deals: Array<{
    brandName: string | null;
    campaignName: string | null;
    value: number | null;
    currency: string | null;
    paymentStatus: string | null;
    closedAt: Date | null;
    stage: string;
    notes: string | null;
  }>
): string {
  const headers = ["Brand", "Campaign", "Status", "Value", "Currency", "Payment Status", "Closed Date"];
  const rows = deals.map((deal) => [
    deal.brandName || "",
    deal.campaignName || "",
    deal.stage === "COMPLETED" ? "Won" : "Lost",
    (deal.value || 0).toString(),
    deal.currency || "USD",
    deal.paymentStatus || "",
    deal.closedAt ? new Date(deal.closedAt).toLocaleDateString("en-GB") : "",
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csv;
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(
  talentName: string,
  stats: {
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    paidValue: number;
  }
): string {
  const unreadValue = stats.totalValue - stats.paidValue;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.15em;
          }
          .header p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
          }
          .metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 30px 0;
          }
          .metric {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #000;
          }
          .metric-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #666;
            margin-bottom: 8px;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #000;
          }
          .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 6px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 10px;
            color: #000;
          }
          .section-content {
            font-size: 14px;
            color: #666;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
          }
          .cta-button {
            display: inline-block;
            margin: 20px auto;
            padding: 12px 30px;
            background-color: #000;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Closed Deals Report</h1>
            <p>${talentName} • ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>

          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Total Closed</div>
              <div class="metric-value">${stats.totalDeals}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Won vs Lost</div>
              <div class="metric-value">${stats.wonDeals} / ${stats.lostDeals}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Value</div>
              <div class="metric-value">£${(stats.totalValue || 0).toLocaleString()}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Paid vs Unpaid</div>
              <div class="metric-value">£${(stats.paidValue || 0).toLocaleString()} / £${(unreadValue || 0).toLocaleString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📊 Report Details</div>
            <div class="section-content">
              <p>Your weekly closed deals report is ready. A detailed CSV file is attached with complete information for all closed opportunities.</p>
              <p>This includes all deals marked as completed or lost, with full payment and currency details.</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || "https://app.thebreak.co"}/admin/talent/${talentName}" class="cta-button">View in Dashboard</a>
          </div>

          <div class="footer">
            <p>This is an automated weekly report. You can manage your export preferences in your dashboard settings.</p>
            <p>© 2024 The Break. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Update or create a scheduled export
 */
export async function updateScheduledExport(
  talentId: string,
  userId: string,
  data: {
    email: string;
    frequency?: "daily" | "weekly";
    dayOfWeek?: number;
    enabled?: boolean;
  }
) {
  try {
    // Check if schedule exists
    const existing = await prisma.exportSchedule.findFirst({
      where: { talentId, userId },
    });

    if (existing) {
      // Update
      const updated = await prisma.exportSchedule.update({
        where: { id: existing.id },
        data,
      });
      await scheduleExportJob(talentId, updated);
      return updated;
    } else {
      // Create
      const created = await prisma.exportSchedule.create({
        data: {
          talentId,
          userId,
          email: data.email,
          frequency: data.frequency || "weekly",
          dayOfWeek: data.dayOfWeek || 1,
          enabled: data.enabled !== false,
        },
      });
      await scheduleExportJob(talentId, created);
      return created;
    }
  } catch (error) {
    console.error("[SCHEDULED_EXPORT] Failed to update schedule:", error);
    throw error;
  }
}

/**
 * Disable a scheduled export
 */
export async function disableScheduledExport(talentId: string, userId: string) {
  try {
    const jobId = `export_${talentId}`;

    // Stop cron job
    if (cronJobs.has(jobId)) {
      const job = cronJobs.get(jobId);
      if (job) {
        job.stop();
        cronJobs.delete(jobId);
      }
    }

    // Update database
    const updated = await prisma.exportSchedule.updateMany({
      where: { talentId, userId },
      data: { enabled: false },
    });

    console.log(`[SCHEDULED_EXPORT] Disabled export schedule for ${talentId}`);
    return updated;
  } catch (error) {
    console.error("[SCHEDULED_EXPORT] Failed to disable schedule:", error);
  }
}

/**
 * Get all active scheduled exports
 */
export async function getActiveSchedules() {
  const schedules = await prisma.exportSchedule.findMany({
    where: { enabled: true },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return schedules;
}

/**
 * Get schedule for a talent
 */
export async function getScheduleForTalent(talentId: string, userId: string) {
  return prisma.exportSchedule.findFirst({
    where: { talentId, userId },
  });
}
