import nodemailer from "nodemailer";
import prisma from '../../lib/prisma';
import { templates, type EmailTemplateName } from '../../emails/templates/index';

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "console@thebreak.co";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER
    ? {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    : undefined
});

type SendEmailArgs = {
  to: string;
  template: EmailTemplateName;
  data?: Record<string, unknown>;
  subject?: string;
};

export async function sendTemplatedEmail({ to, template, data = {}, subject }: SendEmailArgs) {
  const templateDef = templates[template];
  if (!templateDef) throw new Error(`Unknown template ${template}`);
  const rendered = templateDef.render(data as any);
  const resolvedSubject = subject || rendered.subject || templateDef.subject(data as any);

  // Note: emailLog model doesn't exist - using AuditLog instead
  const logId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const log = await prisma.auditLog.create({
    data: {
      id: logId,
      action: "EMAIL_QUEUED",
      entityType: "Email",
      metadata: {
        to,
        subject: resolvedSubject,
        template,
        status: "queued"
      }
    }
  });

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject: resolvedSubject,
      html: rendered.html,
      text: rendered.text
    });
    const metadata = (log.metadata as any) || {};
    await prisma.auditLog.update({ 
      where: { id: log.id }, 
      data: { 
        action: "EMAIL_SENT",
        metadata: {
          ...metadata,
          status: "sent"
        }
      } 
    });
    return { id: log.id, status: "sent" };
  } catch (error) {
    const metadata = (log.metadata as any) || {};
    await prisma.auditLog.update({
      where: { id: log.id },
      data: {
        action: "EMAIL_FAILED",
        metadata: {
          ...metadata,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error"
        }
      }
    });
    throw error;
  }
}

export async function listEmailLogs(limit = 50) {
  // Note: emailLog model doesn't exist - using AuditLog instead
  return prisma.auditLog.findMany({
    where: {
      entityType: "Email"
    },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}
