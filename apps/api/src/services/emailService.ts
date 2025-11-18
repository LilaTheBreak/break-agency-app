import { Prisma, type EmailLog } from "@prisma/client";
import { Resend } from "resend";
import prisma from "../lib/prisma.js";
import { logError, logInfo } from "../lib/logger.js";
import { templates, type EmailTemplateName, type EmailTemplateContext } from "../emails/templates/index.js";

type EmailJob = {
  logId: string;
  to: string;
  template: EmailTemplateName;
  subject?: string;
  data: EmailTemplateContext;
};

const resendApiKey = process.env.RESEND_API_KEY || "";
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM || "console@thebreak.co";

const queue: EmailJob[] = [];

export async function sendEmail({
  to,
  template,
  data = {},
  subject,
  userId
}: {
  to: string;
  template: EmailTemplateName;
  data?: EmailTemplateContext;
  subject?: string;
  userId?: string | null;
}) {
  const templateDef = templates[template];
  if (!templateDef) {
    throw new Error(`Unknown email template ${template}`);
  }

  const log = await prisma.emailLog.create({
    data: {
      to,
      userId: userId ?? null,
      subject: subject ?? templateDef.subject(data),
      template,
      status: "queued",
      metadata: (data ?? undefined) as Prisma.InputJsonValue
    }
  });

  enqueueEmail({
    logId: log.id,
    to,
    template,
    subject,
    data
  });

  return log;
}

export function enqueueEmail(job: EmailJob) {
  queue.push(job);
}

export async function processEmailQueue(max = 10) {
  const jobs = queue.splice(0, max);
  if (jobs.length === 0) return;
  logInfo("Processing email queue", { count: jobs.length });
  await Promise.all(jobs.map((job) => deliverEmail(job)));
}

async function deliverEmail(job: EmailJob) {
  const logEntry = await prisma.emailLog.findUnique({ where: { id: job.logId } });
  if (!logEntry) return;
  const template = templates[job.template];
  const rendered = template.render(job.data);
  const subject = job.subject ?? rendered.subject ?? template.subject(job.data);
  try {
    if (!resendClient) {
      throw new Error("Resend API key not configured");
    }
    await resendClient.emails.send({
      from: emailFrom,
      to: job.to,
      subject,
      html: rendered.html,
      text: rendered.text
    });
    await prisma.emailLog.update({
      where: { id: job.logId },
      data: { status: "sent", updatedAt: new Date() }
    });
  } catch (error) {
    logError("Email delivery failed", error, { logId: job.logId });
    await prisma.emailLog.update({
      where: { id: job.logId },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });
  }
}

export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    template: "welcome",
    data: { firstName: "Break Co. tester", intro: "This is a transactional email smoke test." }
  });
}

export type SendEmailArgs = Parameters<typeof sendEmail>[0];
