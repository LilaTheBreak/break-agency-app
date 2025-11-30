import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import { aiClient } from '../services/ai/aiClient.js';

const getReminderEmail = async (invoice: any, daysOverdue: number) => {
  let tone = 'gentle';
  if (daysOverdue > 14) tone = 'final warning';
  else if (daysOverdue > 7) tone = 'strong notice';
  else if (daysOverdue > 0) tone = 'firm reminder';

  const prompt = `
    Write an invoice reminder email.
    - Invoice ID: ${invoice.xeroId}
    - Amount: ${invoice.amount} ${invoice.currency}
    - Due Date: ${invoice.dueDate}
    - Days Overdue: ${daysOverdue}
    - Tone: ${tone}
    Respond with JSON: { "subject": "...", "body": "..." }
  `;
  return aiClient.json(prompt);
};

async function sendInvoiceReminders() {
  console.log('[CRON] Checking for overdue invoices...');
  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: 'submitted', dueDate: { lt: new Date() } },
  });

  for (const invoice of overdueInvoices) {
    const daysOverdue = Math.floor((new Date().getTime() - new Date(invoice.dueDate!).getTime()) / (1000 * 3600 * 24));
    const emailContent = await getReminderEmail(invoice, daysOverdue) as any;

    // Log the email to be sent
    await prisma.emailLog.create({
      data: { to: invoice.brandEmail!, subject: emailContent.subject, template: 'invoice-reminder', metadata: emailContent },
    });
    console.log(`[CRON] Queued ${daysOverdue > 0 ? 'overdue' : 'due'} reminder for invoice ${invoice.xeroId}.`);
  }
}

// Schedule to run daily at 9 AM
cron.schedule('0 9 * * *', sendInvoiceReminders);