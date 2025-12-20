import { google } from "googleapis";
import { googleConfig } from "../../config/env.js";

const clientId = googleConfig.clientId;
const clientSecret = googleConfig.clientSecret;
// Gmail auth uses a different callback URL than main OAuth
const gmailRedirectUri = process.env.GMAIL_REDIRECT_URI || 
  googleConfig.redirectUri.replace('/api/auth/google/callback', '/api/gmail/auth/callback');

console.log('[GMAIL AUTH] Using redirect URI:', gmailRedirectUri);

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, gmailRedirectUri);

export function getGmailAuthUrl(state: string) {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
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
  return {
    accessToken: tokens.access_token || "",
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    scope: tokens.scope,
    tokenType: tokens.token_type,
    idToken: tokens.id_token
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const client = new google.auth.OAuth2(clientId, clientSecret, gmailRedirectUri);
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.getAccessToken();
  return {
    accessToken: credentials?.token || "",
    refreshToken,
    expiresAt: credentials?.res?.data?.expiry_date ? new Date(credentials.res.data.expiry_date) : undefined
  };
}
