import { google } from "googleapis";
import prisma from "../../lib/prisma.js";
import { sendSlackAlert } from "../../integrations/slack/slackClient.js";
import { googleConfig } from "../../config/env.js";
// import { logAuditEvent } from "../../lib/auditLogger.js"; // No req context in service

const clientId = googleConfig.clientId;
const clientSecret = googleConfig.clientSecret;
const redirectUri = googleConfig.redirectUri;

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

export async function persistToken(userId: string, tokens: {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
  id_token?: string;
}) {
  const accessToken = tokens.access_token || "";
  const refreshToken = tokens.refresh_token || "";
  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
  const scope = tokens.scope || null;
  const tokenType = tokens.token_type || null;
  const idToken = tokens.id_token || null;

  await prisma.gmailToken.upsert({
    where: { userId },
    update: {
      accessToken,
      refreshToken,
      expiryDate: expiresAt,
      scope,
      tokenType,
      idToken
    },
    create: {
      userId,
      accessToken,
      refreshToken,
      expiryDate: expiresAt,
      scope,
      tokenType,
      idToken
    }
  });

  // Audit log: Gmail OAuth connected
  // await logAction({
  //   userId,
  //   action: "GMAIL_OAUTH_CONNECTED",
  //   entityType: "GMAIL_TOKEN",
  //   entityId: userId,
  //   metadata: {
  //     scope,
  //     hasRefreshToken: !!refreshToken,
  //     expiresAt: expiresAt?.toISOString() || null,
  //   },
  // });
}
