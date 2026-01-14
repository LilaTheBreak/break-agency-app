import axios from "axios";
import prisma from '../../lib/prisma.js';

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || process.env.INSTAGRAM_INBOX_REDIRECT_URI;

const isConfigured = Boolean(
  INSTAGRAM_CLIENT_ID && 
  INSTAGRAM_CLIENT_SECRET && 
  INSTAGRAM_REDIRECT_URI
);

/**
 * Gets the Instagram OAuth authorization URL for inbox access (read-only DMs)
 */
export function getInstagramInboxAuthUrl(userId: string): string {
  if (!isConfigured) {
    throw new Error("Instagram OAuth not configured");
  }

  const state = Buffer.from(JSON.stringify({ 
    userId, 
    timestamp: Date.now(),
    purpose: "inbox" // Distinguish from social analytics OAuth
  })).toString("base64");

  // Instagram Graph API scopes for reading DMs
  const scope = "instagram_basic,instagram_manage_messages";
  
  const params = new URLSearchParams({
    client_id: INSTAGRAM_CLIENT_ID!,
    redirect_uri: INSTAGRAM_REDIRECT_URI!,
    scope,
    response_type: "code",
    state
  });

  return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchanges authorization code for access token (read-only inbox access)
 */
export async function exchangeInstagramInboxCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
  userId: string;
}> {
  if (!isConfigured) {
    throw new Error("Instagram OAuth not configured");
  }

  // Exchange code for short-lived token
  const tokenResponse = await axios.post(
    "https://api.instagram.com/oauth/access_token",
    new URLSearchParams({
      client_id: INSTAGRAM_CLIENT_ID!,
      client_secret: INSTAGRAM_CLIENT_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: INSTAGRAM_REDIRECT_URI!,
      code
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    }
  );

  const shortLivedToken = tokenResponse.data.access_token;

  // Exchange for long-lived token (60 days)
  const longLivedResponse = await axios.get("https://graph.instagram.com/access_token", {
    params: {
      grant_type: "ig_exchange_token",
      client_secret: INSTAGRAM_CLIENT_SECRET!,
      access_token: shortLivedToken
    }
  });

  const longLivedToken = longLivedResponse.data.access_token;
  const expiresIn = longLivedResponse.data.expires_in;

  // Get user profile to extract user ID
  const profileResponse = await axios.get("https://graph.instagram.com/me", {
    params: {
      fields: "id,username",
      access_token: longLivedToken
    }
  });

  return {
    accessToken: longLivedToken,
    expiresIn,
    userId: profileResponse.data.id
  };
}

/**
 * Gets or refreshes Instagram inbox access token for a user
 */
export async function getInstagramInboxToken(userId: string): Promise<string | null> {
  const connection = await prisma.socialAccountConnection.findFirst({
    where: {
      creatorId: userId,
      platform: "instagram",
      connected: true
    }
  });

  if (!connection?.accessToken) {
    return null;
  }

  // Check if token needs refresh (within 7 days of expiration)
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (connection.expiresAt && connection.expiresAt < sevenDaysFromNow && connection.accessToken) {
    try {
      const refreshResponse = await axios.get("https://graph.instagram.com/refresh_access_token", {
        params: {
          grant_type: "ig_refresh_token",
          access_token: connection.accessToken
        }
      });

      const refreshedToken = refreshResponse.data.access_token;
      const newExpiresIn = refreshResponse.data.expires_in;

      await prisma.socialAccountConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: refreshedToken,
          expiresAt: new Date(Date.now() + newExpiresIn * 1000),
          lastSyncedAt: new Date()
        }
      });

      return refreshedToken;
    } catch (error) {
      console.error("[INSTAGRAM INBOX] Token refresh failed:", error);
      return connection.accessToken; // Return existing token even if refresh failed
    }
  }

  return connection.accessToken;
}

