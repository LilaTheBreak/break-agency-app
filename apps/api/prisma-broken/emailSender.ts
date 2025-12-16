import prisma from '../../lib/prisma.js';

// This is a placeholder for a real Gmail API client
const gmailClient = {
  send: async (payload: any) => {
    console.log(`[GMAIL STUB] Sending email to ${payload.to} with subject "${payload.subject}"`);
    if (Math.random() < 0.1) throw new Error('Simulated Gmail API failure.');
    return { messageId: `gmail_${Date.now()}` };
  },
};

/**
 * Sends an email from the outbox using the Gmail API.
 * @param emailOutboxId - The ID of the EmailOutbox entry to send.
 */
export async function sendEmailFromOutbox(emailOutboxId: string) {
  const email = await prisma.emailOutbox.findUnique({ where: { id: emailOutboxId } });
  if (!email) throw new Error('Email not found in outbox.');

  await prisma.emailOutbox.update({ where: { id: email.id }, data: { status: 'sending' } });

  try {
    await gmailClient.send({ to: email.to, subject: email.subject, body: email.body });
    await prisma.emailOutbox.update({
      where: { id: email.id },
      data: { status: 'sent', sentAt: new Date() },
    });
  } catch (error: any) {
    await prisma.emailOutbox.update({ where: { id: email.id }, data: { status: 'failed', error: error.message } });
    throw error; // Re-throw to allow the job to be retried
  }
}