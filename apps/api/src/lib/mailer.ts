import nodemailer from "nodemailer";

import { env } from "../env.js";

const transporter = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })
  : null;

export async function sendNotification(to: string, subject: string, html: string) {
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error("[mailer] failed to send notification:", error);
  }
}
