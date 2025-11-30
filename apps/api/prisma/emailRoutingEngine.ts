import prisma from '../../lib/prisma.js';
import { writeAIEmail } from '../ai/aiEmailWriter.js';
import { emailQueue } from '../../worker/queues/emailQueue.js';

/**
 * The main routing engine for all automated emails.
 * @param type - The type of event triggering the email (e.g., 'ASSET_PACK_READY').
 * @param context - The data associated with the event (e.g., { assetPackId, talentId }).
 */
export async function routeEmail(type: string, context: any) {
  console.log(`[EMAIL ROUTER] Routing email for type: ${type}`);

  // 1. Determine recipients and get data
  let to, talent, subject, body;
  if (type === 'ASSET_PACK_READY') {
    const assetPack = await prisma.talentAssetPack.findUnique({ where: { id: context.assetPackId }, include: { talent: { include: { user: true } } } });
    if (!assetPack) throw new Error('Asset pack not found.');
    to = assetPack.talent.user.email;
    talent = assetPack.talent;
    ({ subject, body } = await writeAIEmail({ type, data: { brandName: assetPack.brandName } }));
  } else {
    throw new Error(`Unknown email type: ${type}`);
  }

  // 2. Prepare attachments and tracking pixel
  const attachments = []; // Logic to get S3 URLs would go here
  const outboxEntry = await prisma.emailOutbox.create({
    data: {
      to,
      subject,
      body: '', // Body will be updated after pixel is embedded
      status: 'preparing',
      talentId: talent.id,
      context,
    },
  });

  const trackingPixelUrl = `${process.env.API_URL}/api/inbox/pixel/${outboxEntry.id}`;
  const finalBody = `${body}\n\n<img src="${trackingPixelUrl}" width="1" height="1" alt="" />`;

  // 3. Save to EmailOutbox
  const finalOutboxEntry = await prisma.emailOutbox.update({
    where: { id: outboxEntry.id },
    data: {
      body: finalBody,
      attachments,
      status: 'queued',
    },
  });

  // 4. Enqueue the email sending job
  await emailQueue.add('send-email', { emailOutboxId: finalOutboxEntry.id });

  return finalOutboxEntry;
}