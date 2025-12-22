import { google } from "googleapis";
import prisma from "../../lib/prisma.js";
import { googleConfig } from "../../config/env.js";

export class GmailNotConnectedError extends Error {
  constructor() {
    super("Gmail not connected");
    this.name = "GmailNotConnectedError";
  }
}

export async function getOAuthClientForUser(userId: string) {
  const token = await prisma.gmailToken.findUnique({
    where: { userId },
  });

  if (!token || !token.refreshToken) {
    throw new GmailNotConnectedError();
  }

  const gmailRedirectUri = process.env.GMAIL_REDIRECT_URI || 
    googleConfig.redirectUri.replace('/api/auth/google/callback', '/api/gmail/auth/callback');

  const client = new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    gmailRedirectUri
  );

  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiryDate?.getTime(),
  });

  client.on("tokens", async (newTokens) => {
    try {
      const current = await prisma.gmailToken.findUnique({ where: { userId } });
      if (!current) {
        throw new Error(`Missing gmailToken row for userId=${userId} during refresh`);
      }

      await prisma.gmailToken.update({
        where: { userId },
        data: {
          accessToken: newTokens.access_token ?? current.accessToken,
          refreshToken: newTokens.refresh_token ?? current.refreshToken,
          expiryDate: newTokens.expiry_date ? new Date(newTokens.expiry_date) : current.expiryDate,
          scope: newTokens.scope ?? current.scope,
          tokenType: newTokens.token_type ?? current.tokenType,
          idToken: newTokens.id_token ?? current.idToken,
        },
      });
    } catch (err) {
      console.error("[GMAIL TOKEN REFRESH ERROR]", err);
    }
  });

  return client;
}

/**
 * Gets a Google API client (Gmail) for a specific user
 * @param userId The ID of the user
 * @returns A Gmail API client instance or null if auth fails
 */
export async function getGoogleAPIClient(userId: string) {
  try {
    const client = await getOAuthClientForUser(userId);
    return google.gmail({ version: "v1", auth: client });
  } catch (error) {
    if (error instanceof GmailNotConnectedError) {
      console.error(`Gmail not connected for user ${userId}`);
      return null;
    }
    throw error;
  }
}
