import { google } from "googleapis";
import prisma from "../../lib/prisma.js";
import { safeEnv } from "../../utils/safeEnv.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { SocialPlatform } from "@prisma/client";

const clientId = safeEnv("GOOGLE_OAUTH_CLIENT_ID", "test-client");
const clientSecret = safeEnv("GOOGLE_OAUTH_CLIENT_SECRET", "test-secret");
const redirectUri = safeEnv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:5000/oauth/callback");

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

export function buildAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "openid"
    ],
    state
  });
}

export async function exchangeCodeForTokens(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    await sendSlackAlert("Gmail OAuth missing refresh_token", { code });
  }
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await client.getAccessToken();
    return {
      accessToken: credentials?.token || "",
      expiresAt: credentials?.res?.data?.expiry_date
        ? new Date(credentials.res.data.expiry_date)
        : null
    };
  } catch (error) {
    await sendSlackAlert("Gmail token refresh failed", { error: `${error}` });
    throw error;
  }
}

export async function persistToken(userId: string, tokens: { access_token?: string; refresh_token?: string; expiry_date?: number }) {
  const accessToken = tokens.access_token || "";
  const refreshToken = tokens.refresh_token || "";
  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  await prisma.socialToken.upsert({
    where: { userId_platform: { userId, platform: SocialPlatform.GMAIL } },
    update: {
      accessToken,
      refreshToken,
      expiresAt
    },
    create: {
      userId,
      platform: SocialPlatform.GMAIL,
      accessToken,
      refreshToken,
      expiresAt
    }
  });
}
