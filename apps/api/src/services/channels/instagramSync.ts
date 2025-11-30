import { SocialPlatform } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { fetchInstagramDMs } from "../../integrations/instagram/instagramClient.js";
import { ingestDM } from "../inboundMessage.service.js";

export async function syncInstagram() {
  const tokens = await prisma.socialToken.findMany({
    where: { platform: SocialPlatform.INSTAGRAM, accessToken: { not: null } },
    select: { id: true, userId: true, accessToken: true }
  });

  for (const token of tokens) {
    if (!token.accessToken) continue;
    const messages = await fetchInstagramDMs(token.accessToken);
    for (const message of messages) {
      if (message.externalId) {
        const exists = await prisma.inboundMessage.findFirst({
          where: {
            userId: token.userId,
            platform: "instagram",
            externalId: message.externalId
          }
        });
        if (exists) continue;
      }

      await ingestDM({
        userId: token.userId,
        platform: "instagram",
        message
      });
    }
  }
}
