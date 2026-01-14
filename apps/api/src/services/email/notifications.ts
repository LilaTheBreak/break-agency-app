import { sendTemplatedEmail } from './emailClient';

export async function notifyBriefSubmitted({ creatorEmail, brandEmail, briefName, dueDate }) {
  if (creatorEmail) {
    await sendTemplatedEmail({
      to: creatorEmail,
      template: "newBriefNotification",
      data: { briefName, dueDate }
    });
  }
  if (brandEmail) {
    await sendTemplatedEmail({
      to: brandEmail,
      template: "systemAlert",
      data: { headline: `Brief received`, detail: `${briefName} logged. Due ${dueDate}.` }
    });
  }
}

export async function notifyPayoutDue({ email, amount, dueDate }) {
  if (!email) return;
  await sendTemplatedEmail({
    to: email,
    template: "payoutReminder",
    data: { amount, dueDate }
  });
}

export async function notifyInvoiceOverdue({ email, invoice, daysOverdue }) {
  if (!email) return;
  await sendTemplatedEmail({
    to: email,
    template: "invoiceOverdue",
    data: { invoice, daysOverdue }
  });
}
