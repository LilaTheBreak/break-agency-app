import prisma from '../lib/prisma';
import { CronJobDefinition, parseCommaList } from './types';
import { sendTemplatedEmail } from '../services/email/emailClient';

const DIGEST_RECIPIENTS = parseCommaList(process.env.BRIEF_DIGEST_RECIPIENTS || process.env.FOUNDERS_EMAILS);

export const sendDailyBriefDigestJob: CronJobDefinition = {
  name: "send-daily-brief-digest",
  schedule: "0 8 * * *",
  description: "Aggregates new briefs from the last 24h and emails stakeholders.",
  handler: async () => {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
    // Note: emailLog model doesn't exist - using AuditLog instead
    const emailLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "Email",
        action: { in: ["EMAIL_QUEUED", "EMAIL_SENT"] }
      }
    });
    // For now, return empty array - this cron job needs to be refactored
    // TODO: Refactor to query actual briefs/opportunities instead of email logs
    const briefs: any[] = [];

    if (briefs.length && DIGEST_RECIPIENTS.length) {
      const lines = briefs.map((brief) => `${brief.subject} → ${brief.to}`);
      for (const email of DIGEST_RECIPIENTS) {
        await sendTemplatedEmail({
          to: email,
          template: "systemAlert",
          data: {
            headline: "Daily brief digest",
            detail: lines.join("\n") || "No briefs today"
          }
        });
      }
    }

    return { briefs: briefs.length, recipients: DIGEST_RECIPIENTS.length };
  }
};
