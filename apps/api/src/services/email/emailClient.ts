import nodemailer from "nodemailer";
import prisma from "../../lib/prisma.js";
import { templates, type EmailTemplateName } from "../../emails/templates/index.js";

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
  const rendered = templateDef.render(data);
  const resolvedSubject = subject || rendered.subject || templateDef.subject(data);

  const log = await prisma.emailLog.create({
    data: {
      to,
      subject: resolvedSubject,
      template,
      status: "queued"
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
    await prisma.emailLog.update({ where: { id: log.id }, data: { status: "sent" } });
    return { id: log.id, status: "sent" };
  } catch (error) {
    await prisma.emailLog.update({
      where: { id: log.id },
      data: { status: "failed" }
    });
    throw error;
  }
}

export async function listEmailLogs(limit = 50) {
  return prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit
  });
}
