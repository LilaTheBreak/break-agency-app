import axios from "axios";
import prisma from "../../lib/prisma.js";

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || process.env.TIKTOK_INBOX_REDIRECT_URI;

const isConfigured = Boolean(
  TIKTOK_CLIENT_KEY && 
  TIKTOK_CLIENT_SECRET && 
  TIKTOK_REDIRECT_URI
);

/**
 * Gets the TikTok OAuth authorization URL for inbox access (read-only messages/comments)
 */
export function getTikTokInboxAuthUrl(userId: string): string {
  if (!isConfigured) {
    throw new Error("TikTok OAuth not configured");
  }

  const state = Buffer.from(JSON.stringify({ 
    userId, 
    timestamp: Date.now(),
    purpose: "inbox" // Distinguish from social analytics OAuth
  })).toString("base64");

  // TikTok API scopes for reading messages/comments
  const scope = "user.info.basic,message.send,message.list";
  
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY!,
    redirect_uri: TIKTOK_REDIRECT_URI!,
    scope,
    response_type: "code",
    state
  });

  return `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
}

/**
 * Exchanges authorization code for access token (read-only inbox access)
 */
export async function exchangeTikTokInboxCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  openId: string;
}> {
  if (!isConfigured) {
    throw new Error("TikTok OAuth not configured");
  }

  const tokenResponse = await axios.post(
    "https://open.tiktokapis.com/v2/oauth/token/",
    {
      client_key: TIKTOK_CLIENT_KEY!,
      client_secret: TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: TIKTOK_REDIRECT_URI!
    },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  const tokenData = tokenResponse.data.data;
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    openId: tokenData.open_id
  };
}

/**
 * Gets or refreshes TikTok inbox access token for a user
 */
export async function getTikTokInboxToken(userId: string): Promise<string | null> {
  const connection = await prisma.socialAccountConnection.findFirst({
    where: {
      creatorId: userId,
      platform: "tiktok",
      connected: true
    }
  });

  if (!connection?.accessToken) {
    return null;
  }

  // Check if token needs refresh (TikTok tokens expire in 24 hours)
  if (connection.expiresAt && connection.expiresAt < new Date() && connection.refreshToken) {
    try {
      const refreshResponse = await axios.post(
        "https://open.tiktokapis.com/v2/oauth/token/",
        {
          client_key: TIKTOK_CLIENT_KEY!,
          client_secret: TIKTOK_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: connection.refreshToken
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
      );

      const refreshedData = refreshResponse.data.data;

      await prisma.socialAccountConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: refreshedData.access_token,
          refreshToken: refreshedData.refresh_token,
          expiresAt: new Date(Date.now() + refreshedData.expires_in * 1000),
          lastSyncedAt: new Date()
        }
      });

      return refreshedData.access_token;
    } catch (error) {
      console.error("[TIKTOK INBOX] Token refresh failed:", error);
      return connection.accessToken; // Return existing token even if refresh failed
    }
  }

  return connection.accessToken;
}

