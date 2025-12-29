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

  if (!token) {
    console.log(`[GMAIL TOKEN] No token found for user ${userId}`);
    throw new GmailNotConnectedError();
  }

  if (!token.refreshToken) {
    console.error(`[GMAIL TOKEN] Missing refresh token for user ${userId}`);
    throw new GmailNotConnectedError();
  }

  // Use same redirect URI derivation as auth flow
  const gmailRedirectUri = process.env.GMAIL_REDIRECT_URI || 
    (googleConfig.redirectUri 
      ? googleConfig.redirectUri.replace('/api/auth/google/callback', '/api/gmail/auth/callback')
      : 'http://localhost:5001/api/gmail/auth/callback');

  console.log(`[GMAIL TOKEN] Creating OAuth client for user ${userId}`, {
    hasAccessToken: !!token.accessToken,
    hasRefreshToken: !!token.refreshToken,
    tokenExpiry: token.expiryDate?.toISOString(),
    redirectUri: gmailRedirectUri,
  });

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
          lastError: null, // Clear error on successful refresh
          lastErrorAt: null,
        },
      });
      
      console.log(`[GMAIL TOKEN REFRESH] Success for userId=${userId}`);
    } catch (err) {
      console.error("[GMAIL TOKEN REFRESH ERROR]", {
        userId,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      
      // Update lastError field
      try {
        const errorMessage = err instanceof Error ? err.message : String(err);
        await prisma.gmailToken.update({
          where: { userId },
          data: {
            lastError: errorMessage.slice(0, 500), // Limit error message length
            lastErrorAt: new Date(),
          },
        });
        
        // Log specific error types for debugging
        if (errorMessage.includes('invalid_grant')) {
          console.error(`[GMAIL TOKEN] Invalid grant for user ${userId} - user needs to reconnect Gmail`);
        } else if (errorMessage.includes('invalid_client')) {
          console.error(`[GMAIL TOKEN] Invalid client credentials - check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET`);
        }
      } catch (updateError) {
        console.error("[GMAIL TOKEN ERROR UPDATE FAILED]", updateError);
      }
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
