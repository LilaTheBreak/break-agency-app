import prisma from "../../lib/prisma.js";
import { SocialPlatform } from "@prisma/client";

export async function ensureSocialToken(userId: string, platform: SocialPlatform) {
  const token = await prisma.socialToken.findUnique({
    where: {
      userId_platform: {
        userId,
        platform
      }
    }
  });
  if (!token) {
    throw new Error(`No ${platform} account connected for this user.`);
  }
  return token;
}

export function createIntegrationError(provider: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const err = new Error(`[${provider}] ${message}`);
  return err;
}
