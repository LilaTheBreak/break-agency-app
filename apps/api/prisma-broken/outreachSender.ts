import prisma from '../../lib/prisma.js';
import { routeEmail } from '../email/emailRoutingEngine.js';

/**
 * "Sends" an outreach email by creating an EmailOutbox entry.
 * @param suggestionId - The ID of the OutreachSuggestion to send.
 */
export async function sendOutreachEmail(suggestionId: string) {
  const suggestion = await prisma.outreachSuggestion.findUnique({
    where: { id: suggestionId },
    include: { lead: true },
  });

  if (!suggestion) throw new Error('Outreach suggestion not found.');

  console.log(`[OUTREACH SENDER] Preparing to send email to ${suggestion.lead.brandEmail}`);

  // Use the S50 email routing engine to queue the email
  await routeEmail('OUTREACH', {
    to: suggestion.lead.brandEmail,
    subject: suggestion.subject,
    body: suggestion.body,
    userId: suggestion.userId,
    context: {
      leadId: suggestion.leadId,
      suggestionId: suggestion.id,
    },
  });

  await prisma.outreachSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'sent' },
  });
}