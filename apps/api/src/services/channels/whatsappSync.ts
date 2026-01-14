import prisma from '../../lib/prisma';
import { fetchWhatsAppMessages } from '../../integrations/whatsapp/whatsappClient';
import { ingestDM } from '../inboundMessage.service';

const WHATSAPP_BUSINESS_ID = process.env.WHATSAPP_BUSINESS_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function syncWhatsApp() {
  if (!WHATSAPP_BUSINESS_ID || !WHATSAPP_ACCESS_TOKEN) {
    return;
  }

  const users = await prisma.user.findMany({
    select: { id: true }
  });

  const messages = await fetchWhatsAppMessages(WHATSAPP_BUSINESS_ID, WHATSAPP_ACCESS_TOKEN);

  for (const user of users) {
    for (const message of messages) {
      if ((message as any).whatsappId) {
        const exists = await prisma.inboundEmail.findFirst({
          where: {
            userId: user.id,
            platform: "whatsapp",
            whatsappId: (message as any).whatsappId
          }
        });
        if (exists) continue;
      }

      await ingestDM({
        userId: user.id,
        platform: "whatsapp",
        message
      });
    }
  }
}
